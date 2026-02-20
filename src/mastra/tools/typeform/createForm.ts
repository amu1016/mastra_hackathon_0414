import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { TypeformFormInput } from "../../utils/typeform/questionValidator";

export interface TypeformFormResponse {
  id: string;
  title: string;
  _links: {
    display: string;
  };
}

export const createFormTool = createTool({
  id: "create-typeform-form",
  description: "Create a new Typeform form using the Typeform Create API",
  inputSchema: z.object({
    formData: z.object({
      title: z.string(),
      description: z.string().optional(),
      questions: z.array(
        z.object({
          type: z.enum([
            "short_text",
            "long_text",
            "multiple_choice",
            "dropdown",
            "yes_no",
            "date",
            "number",
            "email",
            "phone_number",
          ]),
          title: z.string(),
          required: z.boolean().optional(),
          properties: z
            .object({
              choices: z
                .array(z.object({ label: z.string() }))
                .optional(),
              min: z.number().optional(),
              max: z.number().optional(),
            })
            .optional(),
        })
      ),
    }),
  }),
  outputSchema: z.object({
    formId: z.string(),
    formUrl: z.string(),
    title: z.string(),
  }),
  execute: async ({ context }) => {
    const { formData } = context;

    const apiUrl =
      process.env.TYPEFORM_API_URL || "https://api.typeform.com";
    const apiToken = process.env.TYPEFORM_CUSTOM_TOKEN;

    if (!apiToken) {
      throw new Error("TYPEFORM_CUSTOM_TOKEN環境変数が設定されていません");
    }

    // Typeform Create APIの形式に変換
    const typeformPayload = {
      title: formData.title,
      settings: {
        is_public: false,
        is_trial: false,
      },
      fields: formData.questions.map((q) => {
        const field: Record<string, unknown> = {
          type: q.type,
          title: q.title,
        };

        // validationsオブジェクトを作成（requiredを含む）
        const validations: Record<string, unknown> = {};
        if (q.required !== undefined) {
          validations.required = q.required;
        }

        // propertiesオブジェクトを作成（choicesを含む）
        const properties: Record<string, unknown> = {};
        if (q.properties) {
          if (q.properties.choices && q.properties.choices.length > 0) {
            properties.choices = q.properties.choices.map((c) => ({
              label: c.label,
            }));
          }
          // numberタイプの場合、min/maxはvalidationsに配置（Typeform API: min_value は 0 以上必須）
          if (q.type === "number") {
            if (q.properties.min !== undefined) {
              validations.min_value = Math.max(0, q.properties.min);
            }
            if (q.properties.max !== undefined) {
              let maxVal = q.properties.max;
              if (validations.min_value !== undefined && maxVal < (validations.min_value as number)) {
                maxVal = validations.min_value as number;
              }
              validations.max_value = maxVal;
            }
          }
        }

        // validationsが空でない場合のみ追加
        if (Object.keys(validations).length > 0) {
          field.validations = validations;
        }

        // propertiesが空でない場合のみ追加
        if (Object.keys(properties).length > 0) {
          field.properties = properties;
        }

        return field;
      }),
    };

    try {
      const response = await fetch(`${apiUrl}/forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(typeformPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Typeform APIエラー: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = (await response.json()) as TypeformFormResponse;

      return {
        formId: result.id,
        formUrl: result._links.display,
        title: result.title,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Typeform API呼び出しに失敗しました: ${String(error)}`);
    }
  },
});
