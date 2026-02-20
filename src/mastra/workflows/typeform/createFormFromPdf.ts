import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { questionExtractionAgent } from "../../agents/typeform/questionExtractionAgent";
import { validateAndFixTypeformJson } from "../../utils/typeform/questionValidator";
import type { TypeformApiForm } from "../../utils/typeform/questionValidator";
import { GoogleGenAI } from "@google/genai";

/**
 * PDFから質問を抽出するステップ
 */
const extractQuestionsFromPdfStep = new Step({
  id: "extract-questions-from-pdf",
  description: "Extract questions from PDF using AI agent",
  inputSchema: z.object({
    pdfBase64Data: z.string(),
  }),
  outputSchema: z.object({
    questionsJson: z.any(),
  }),
  execute: async ({ context }) => {
    const pdfBase64Data = context?.getStepResult<{ pdfBase64Data: string }>(
      "trigger"
    ).pdfBase64Data;

    if (!pdfBase64Data) {
      throw new Error("PDFデータが提供されていません");
    }

    // PDFのBase64データをバッファに変換してサイズを確認
    const pdfBuffer = Buffer.from(pdfBase64Data, "base64");
    const pdfSizeKB = pdfBuffer.length / 1024;
    const base64Length = pdfBase64Data.length;
    
    console.log(`📄 PDFサイズ: ${pdfSizeKB.toFixed(0)}KB (Base64文字列: ${(base64Length / 1024).toFixed(0)}KB)`);

    // PDFが大きすぎる場合（約300KB以上）は、Gemini Files APIを使用
    const isLargePdf = pdfBuffer.length > 300 * 1024; // 300KB以上
    const EXTRACTION_PROMPT = `以下のPDFファイルから問診票の質問項目を抽出し、Typeform互換のJSON形式で出力してください。`;

    try {
      let questionsJson: unknown;

      if (isLargePdf) {
        // 大きいPDFの場合は、Gemini Files APIを使用してPDFをアップロード
        console.log(`📎 大きいPDFを検出しました。Gemini Files APIを使用してアップロードします。`);
        
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error("GOOGLE_API_KEY環境変数が設定されていません");
        }

        // Gemini Files APIを使用してPDFをアップロード
        const genai = new GoogleGenAI({ apiKey });
        
        // 一時ファイルとしてPDFを保存してアップロード
        const { writeFileSync, unlinkSync } = await import("fs");
        const { join } = await import("path");
        const { tmpdir } = await import("os");
        const tempFilePath = join(tmpdir(), `questionnaire-${Date.now()}.pdf`);
        
        try {
          writeFileSync(tempFilePath, pdfBuffer);
          
          const uploadedFile = await genai.files.upload({
            file: tempFilePath,
            config: { mimeType: "application/pdf" },
          });
          
          if (!uploadedFile.uri) {
            throw new Error("ファイルアップロードに失敗しました: URIが取得できませんでした");
          }
          
          console.log(`✅ PDFをアップロードしました: ${uploadedFile.uri}`);
          
          // Gemini GenAI SDKのgenerateContentを使用
          const { createUserContent, createPartFromUri } = await import("@google/genai");
          
          const fullPrompt = EXTRACTION_PROMPT + "\n\n" + questionExtractionAgent.instructions + `

以下のJSON形式で出力してください（前後に説明文やコードブロック記号は不要です）：
{
  "title": "問診票のタイトル",
  "description": "説明（任意）",
  "questions": [
    {
      "type": "short_text",
      "title": "質問文",
      "required": true,
      "properties": {}
    }
  ]
}`;

          const response = await genai.models.generateContent({
            model: "gemini-2.0-flash-001",
            contents: createUserContent([
              createPartFromUri(uploadedFile.uri, uploadedFile.mimeType || "application/pdf"),
              fullPrompt,
            ]),
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error("Gemini APIからの応答が空です");
          }

          // JSONコードブロックを除去
          const jsonTextWithoutCodeBlock = responseText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          try {
            questionsJson = JSON.parse(jsonTextWithoutCodeBlock);
          } catch (parseError) {
            throw new Error(
              `JSONのパースに失敗しました: ${String(parseError)}。応答内容: ${jsonTextWithoutCodeBlock.substring(0, 500)}`
            );
          }
          
          // 一時ファイルを削除
          unlinkSync(tempFilePath);
          
          // アップロードしたファイルを削除（48時間後に自動削除されますが、明示的に削除）
          try {
            const fileName = uploadedFile.name;
            if (fileName) {
              await genai.files.delete({ name: fileName });
              console.log(`🗑️  アップロードファイルを削除しました: ${fileName}`);
            }
          } catch (deleteError) {
            console.warn("アップロードファイルの削除に失敗しました（48時間後に自動削除されます）:", deleteError);
          }
        } catch (fileError) {
          // 一時ファイルを削除
          try {
            unlinkSync(tempFilePath);
          } catch {}
          throw fileError;
        }
      } else {
        // 小さいPDFの場合は既存の方法を使用
        console.log(`📄 小さいPDFを検出しました。Base64として送信します。`);
        
        const EXTRACTION_PROMPT_WITH_DATA = `以下のPDFのbase64データから問診票の質問項目を抽出し、Typeform互換のJSON形式で出力してください。

${pdfBase64Data}`;

        const response = await questionExtractionAgent.stream([
          {
            role: "user",
            content: EXTRACTION_PROMPT_WITH_DATA,
          },
        ]);

        let jsonText = "";
        let chunkCount = 0;

        for await (const chunk of response.textStream) {
          jsonText += chunk;
          chunkCount++;
        }

        console.log(`📥 Agentからの応答を受信しました (${chunkCount}チャンク、${jsonText.length}文字)`);

        if (jsonText.length === 0) {
          throw new Error(
            `Agentからの応答が空です。PDFサイズ: ${pdfSizeKB.toFixed(0)}KB。`
          );
        }

        // JSONコードブロックを除去
        const jsonTextWithoutCodeBlock = jsonText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        try {
          questionsJson = JSON.parse(jsonTextWithoutCodeBlock);
        } catch (parseError) {
          throw new Error(
            `JSONのパースに失敗しました: ${String(parseError)}。応答内容: ${jsonTextWithoutCodeBlock.substring(0, 500)}`
          );
        }
      }

      return { questionsJson };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`質問抽出に失敗しました: ${error.message}`);
      }
      throw new Error(`質問抽出に失敗しました: ${String(error)}`);
    }
  },
});

/**
 * JSONをバリデーション・修正するステップ
 */
const validateAndFixJsonStep = new Step({
  id: "validate-and-fix-json",
  description: "Validate and fix the extracted questions JSON",
  inputSchema: z.object({
    questionsJson: z.any(),
  }),
  outputSchema: z.object({
    fixedFormData: z.any(),
  }),
  execute: async ({ context }) => {
    const questionsJson = context?.getStepResult<{ questionsJson: unknown }>(
      "extract-questions-from-pdf"
    ).questionsJson;

    if (!questionsJson) {
      throw new Error("質問JSONが提供されていません");
    }

    const validationResult = validateAndFixTypeformJson(questionsJson);

    if (!validationResult.valid) {
      console.warn("バリデーションエラー:", validationResult.errors);
      // 致命的なエラーでない限り、修正されたJSONを使用
      if (
        !validationResult.fixedJson.title ||
        validationResult.fixedJson.fields.length === 0
      ) {
        throw new Error(
          `致命的なバリデーションエラー: ${validationResult.errors.join(", ")}`
        );
      }
    }

    return { fixedFormData: validationResult.fixedJson };
  },
});

/**
 * Typeformフォームを作成するステップ
 */
const createTypeformFormStep = new Step({
  id: "create-typeform-form",
  description: "Create Typeform form using the validated questions",
  inputSchema: z.object({
    formTitle: z.string().optional(),
    formDescription: z.string().optional(),
  }),
  outputSchema: z.object({
    formId: z.string(),
    formUrl: z.string(),
    title: z.string(),
  }),
  execute: async ({ context }) => {
    const fixedFormData = context?.getStepResult<{ fixedFormData: unknown }>(
      "validate-and-fix-json"
    ).fixedFormData;

    const triggerData = context?.getStepResult<{
      formTitle?: string;
      formDescription?: string;
    }>("trigger");

    // 仕様: fixedJson は Typeform API 形式のため、そのまま送信する（fixedJson の中身のみ送信）
    const payload = fixedFormData as TypeformApiForm;
    if (triggerData?.formTitle) {
      payload.title = triggerData.formTitle;
    }
    const typeformPayload: {
      title: string;
      fields: typeof payload.fields;
      settings: Record<string, unknown>;
      logic?: typeof payload.logic;
    } = {
      title: payload.title,
      fields: payload.fields,
      settings: {
        language: "ja",
        ...payload.settings,
        is_public: false,
        is_trial: false,
      },
    };

    if (payload.logic && payload.logic.length > 0) {
      typeformPayload.logic = payload.logic;
    }

    const apiUrl =
      process.env.TYPEFORM_API_URL || "https://api.typeform.com";
    const apiToken = process.env.TYPEFORM_CUSTOM_TOKEN;

    if (!apiToken) {
      throw new Error("TYPEFORM_CUSTOM_TOKEN環境変数が設定されていません");
    }

    console.log("📤 Typeform APIに送信するペイロード:", JSON.stringify(typeformPayload, null, 2));

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

      const result = (await response.json()) as {
        id: string;
        title: string;
        _links: {
          display: string;
        };
      };

      return {
        formId: result.id,
        formUrl: result._links.display,
        title: result.title,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Typeformフォーム作成に失敗しました: ${error.message}`);
      }
      throw new Error(`Typeformフォーム作成に失敗しました: ${String(error)}`);
    }
  },
});

/**
 * 結果サマリを返すステップ（オプション）
 */
const returnSummaryStep = new Step({
  id: "return-summary",
  description: "Return summary of created form",
  inputSchema: z.object({}),
  outputSchema: z.object({
    summary: z.object({
      formId: z.string(),
      formUrl: z.string(),
      title: z.string(),
      questionCount: z.number(),
    }),
  }),
  execute: async ({ context }) => {
    const formResult = context?.getStepResult<{
      formId: string;
      formUrl: string;
      title: string;
    }>("create-typeform-form");

    const fixedFormData = context?.getStepResult<{ fixedFormData: unknown }>(
      "validate-and-fix-json"
    ).fixedFormData;

    const questionCount =
      (fixedFormData as { fields?: unknown[] })?.fields?.length ?? 0;

    return {
      summary: {
        formId: formResult.formId,
        formUrl: formResult.formUrl,
        title: formResult.title,
        questionCount,
      },
    };
  },
});

/**
 * PDFからTypeformフォームを作成するWorkflow
 */
const createTypeformFormFromPdfWorkflow = new Workflow({
  name: "create-typeform-form-from-pdf",
  triggerSchema: z.object({
    pdfBase64Data: z.string().describe("問診票PDFのBase64エンコードされた文字列"),
    formTitle: z.string().optional().describe("フォームタイトル（指定しない場合はPDFから抽出）"),
    formDescription: z.string().optional().describe("フォーム説明（指定しない場合はPDFから抽出）"),
    hospitalMeta: z
      .object({
        name: z.string().optional(),
        code: z.string().optional(),
      })
      .optional()
      .describe("病院メタデータ（将来の拡張用）"),
  }),
})
  .step(extractQuestionsFromPdfStep)
  .then(validateAndFixJsonStep)
  .then(createTypeformFormStep)
  .then(returnSummaryStep);

createTypeformFormFromPdfWorkflow.commit();

export { createTypeformFormFromPdfWorkflow };
