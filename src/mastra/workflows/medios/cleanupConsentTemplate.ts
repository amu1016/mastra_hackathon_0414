import { Agent } from "@mastra/core/agent";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { google } from "../../models";
import { signIn, signOut } from "../../repositpry/firebase";
import { getConsentTemplate } from "../../repositpry/medios/staff/consent/getConsentTemplate";
import {
  updateConsentTemplate,
  UpdateConsentTemplateInput,
} from "../../repositpry/medios/staff/consent/updateConsentTemplate";

const gemini = google("gemini-2.0-flash-001");

// ここで同意書のプロット整形の指示を書く
const agent = new Agent({
  name: "Cleanup Consent Template Agent",
  model: gemini,
  instructions: `
    PDFの上にinputFormを配置し、それをユーザーに入力してもらい入力後のPDFを保存する機構で使われるテンプレートを整形してほしいです。

    与えるもの
    ・PDFのbase64の文字列(複数ページの場合もある)
    ・PDFの上にプロットされるinputFormの情報(ページ数や座標を含む)

    手順
    1_PDFのbase64Dataと復元
    2_その上にプロットされるinputFormを再現
    3_プロットの位置が近しく、少しだけずれているものを微調整して座標を合わせる(縦一列にしたほうが綺麗に見える)
    4_調整後のinputFormの情報をJSONのみで返す(前後に説明文、ラベル、コードブロック記号（｀｀｀）などは一切不要です。)

    Use this JSON schema:
    'elements': {
      'htmlType':
        | "TEXT"
        | "DATE"
        | "DATETIME"
        | "CHECK_BOX"
        | "NUMBER"
        | "BIRTHDAY"
        | "SELECT";
      'plotType':
        | "CONSENT_DATE"
        | "CONSENT_DATETIME"
        | "INFORMED_DATE"
        | "PATIENT_ID"
        | "INFORMED_STAFF"
        | "STAFF_NAME"
        | "PATIENT_NAME"
        | "PATIENT_BIRTHDAY"
        | "MEDICAL_PRACTICE"
        | "CHECK_ELEMENT"
        | "SURGERY_DATE"
        | "FREE_TEXT_ELEMENT"
        | "FREE_DATE_ELEMENT"
        | "FREE_SELECT_ELEMENT"
        | "PATIENT_NAME_FROM_STAFF"
        | "FREE_HAND_ELEMENT";
      'required': "REQUIRED" | "OPTIONAL";
      'inputPosition': {
        'top': number;
        'left': number;
        'page': number;
      };
      'name': string;
      'target': "PATIENT" | "STAFF";
    }[];

    Return: '{ elements }'

    注意
    プロットの縦、あるいは横が大きくずれているものは配置が正しいと考えられるものなので変更の必要はない。
    あくまで立て、あるいは横の座標を揃えたほうが良いものの座標を調整するものである
  `,
});

const staffLoginStep = new Step({
  id: "staff-login",
  description: "Login to the staff portal",
  inputSchema: z.object({
    email: z.string(),
    password: z.string(),
  }),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{
      email: string;
      password: string;
    }>("trigger");
    const { email, password } = triggerData;
    const token = await login(email, password);
    return { token };
  },
});

const cleanConsentTemplateStep = new Step({
  id: "clean-consent-template",
  description: "Clean the consent template",
  inputSchema: z.object({
    id: z.number(),
  }),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const id = context?.getStepResult<{ id: number }>("trigger").id;
    const token = context?.getStepResult<{ token: string }>(
      "staff-login"
    ).token;
    const consentTemplate = await getConsentTemplate(token, id);
    const pdfBase64Data = consentTemplate.pdfBase64Data;
    const consentTemplatePlots = consentTemplate.consentTemplatePlots;
    const objJson = {
      pdfBase64Data,
      consentTemplatePlots,
    };
    const CLEAN_UP_PROMPT = `
      ${JSON.stringify(objJson)}
    `;
    const response = await agent.stream([
      {
        role: "user",
        content: CLEAN_UP_PROMPT,
      },
    ]);

    let jsonText = "";

    for await (const chunk of response.textStream) {
      // process.stdout.write(chunk);
      jsonText += chunk;
    }
    if (jsonText.length === 0) {
      throw new Error("JSON text is empty");
    }
    const jsonTextWithoutCodeBlock = jsonText
      .replace(/```json\n/, "")
      .replace(/\n```/, "");
    const json = JSON.parse(jsonTextWithoutCodeBlock);
    const updateConsentTemplateInput = {
      elements: json.elements,
      name: consentTemplate.title,
      description: consentTemplate.description || "",
      fontSize: consentTemplate.fontSize,
    };
    // 整形した同意書をアップデートする
    await updateConsentTemplate(updateConsentTemplateInput, id, token);
    return {};
  },
});

const signOutStep = new Step({
  id: "sign-out",
  description: "Sign out of the staff portal",
  execute: async () => {
    await signOut();
  },
});

const login = async (email: string, password: string) => {
  try {
    const res = await signIn(email, password);
    const token = res.token;
    return token;
  } catch (error) {
    console.error(error);
    throw new Error("ログインに失敗しました");
  }
};

const cleanupConsentTemplateWorkflow = new Workflow({
  name: "cleanup-consent-template",
  triggerSchema: z.object({
    email: z.string(),
    password: z.string(),
    id: z.number(),
  }),
})
  .step(staffLoginStep)
  .then(cleanConsentTemplateStep)
  .then(signOutStep);

cleanupConsentTemplateWorkflow.commit();

export { cleanupConsentTemplateWorkflow };
