import { Agent } from "@mastra/core/agent";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { google, vertex } from "../../../models";
import { signIn, signOut } from "../../../repositpry/firebase";
import { CREATE_AGENT_INSTRUCTION } from "./const";
import {
  createConsentTemplate,
  CreateTemplateInput,
} from "../../../repositpry/medios/staff/consent/createTemplate";
import { convertBase64ToBinary } from "./convert";
import { uploadPdf } from "../../../repositpry/medios/staff/consent/uploadPdf";
import { openRouter } from "../../../models";
import { openai } from "@ai-sdk/openai";
import { HarmCategory, HarmBlockThreshold } from "@google/genai";

const gemini = google("gemini-2.0-flash-001");

// const generationConfig = {
//   maxOutputTokens: 8192,
//   temperature: 0.2,
//   topP: 0.8,
//   responseModalities: ["TEXT"],
//   safetySettings: [
//     {
//       category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//       threshold: HarmBlockThreshold.BLOCK_NONE,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//       threshold: HarmBlockThreshold.BLOCK_NONE,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//       threshold: HarmBlockThreshold.BLOCK_NONE,
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//       threshold: HarmBlockThreshold.BLOCK_NONE,
//     },
//   ],
//   systemInstruction: {
//     parts: [{ text: CREATE_AGENT_INSTRUCTION }],
//   },
// };

// ここで同意書のプロット整形の指示を書く
const createConsentTemplateAgent = new Agent({
  name: "Create Consent Template Agent",
  model: gemini,
  // instructions: CREATE_AGENT_INSTRUCTION,
  instructions: "",
});

// const evaluateConsentTemplateAgent = new Agent({
//   name: "Evaluate Consent Template Agent",
//   model: gemini,
//   instructions: EVALUATE_AGENT_INSTRUCTION,
// });

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

const generateConsentTemplateElementsStep = new Step({
  id: "generate-consent-template-elements",
  description: "Generate the consent template elements",
  inputSchema: z.object({
    pdfBase64Data: z.string(),
  }),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const pdfId = context?.getStepResult<{ pdfId: number }>("upload-pdf").pdfId;
    const pdfBase64Data = context?.getStepResult<{ pdfBase64Data: string }>(
      "trigger"
    ).pdfBase64Data;
    // const CREATE_TEMPLATE_PROMPT = `猫はどんな生き物ですか？`;
    // const CREATE_TEMPLATE_PROMPT = `
    //   下記はある同意書のPDFのbase64データです。復元して、同意書のテンプレートを作成してください。
    //   ${pdfBase64Data}
    // `;
    // let response;
    // try {
    //   response = await createConsentTemplateAgent.stream([
    //     {
    //       role: "user",
    //       content: CREATE_TEMPLATE_PROMPT,
    //     },
    //   ]);
    // } catch (error) {
    //   console.error(error);
    //   throw error;
    // }

    // const chat = ai.chats.create({
    //   model: "gemini-2.0-flash-001",
    //   config: generationConfig,
    // });

    // const response = await chat.sendMessage({
    //   message: CREATE_TEMPLATE_PROMPT,
    // });
    // process.stdout.write("stream result: ");
    // let jsonText = "";
    // for await (const chunk of response.textStream) {
    //   jsonText += chunk;
    //   process.stdout.write(chunk);
    // }

    // console.log("jsonText", jsonText);

    // let jsonText = response?.text || "";

    const jsonText = `{
  "name": "白内障手術に関する同意書",
  "fontSize": 24,
  "description": "",
  "elements": [
    {
      "htmlType": "TEXT",
      "plotType": "MEDICAL_PRACTICE",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.1453857421875,
        "left": 0.16864013671875,
        "page": 4
      },
      "name": "診療行為名",
      "target": "STAFF"
    },
    {
      "htmlType": "DATE",
      "plotType": "SURGERY_DATE",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.248779296875,
        "left": 0.205078125,
        "page": 4
      },
      "name": "手術予定日",
      "target": "STAFF"
    },
    {
      "htmlType": "TEXT",
      "plotType": "STAFF_NAME",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.44384765625,
        "left": 0.2138671875,
        "page": 4
      },
      "name": "医師名",
      "target": "STAFF"
    },
    {
      "htmlType": "TEXT",
      "plotType": "INFORMED_STAFF",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.498046875,
        "left": 0.2138671875,
        "page": 4
      },
      "name": "説明医師",
      "target": "STAFF"
    },
    {
      "htmlType": "DATE",
      "plotType": "INFORMED_DATE",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.69921875,
        "left": 0.2421875,
        "page": 4
      },
      "name": "説明日",
      "target": "STAFF"
    },
    {
      "htmlType": "TEXT",
      "plotType": "PATIENT_NAME",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.798828125,
        "left": 0.2138671875,
        "page": 4
      },
      "name": "患者署名欄",
      "target": "PATIENT"
    },
    {
      "htmlType": "TEXT",
      "plotType": "FREE_TEXT_ELEMENT",
      "required": "OPTIONAL",
      "inputPosition": {
        "top": 0.8984375,
        "left": 0.2138671875,
        "page": 4
      },
      "name": "同席者氏名",
      "target": "PATIENT"
    },
    {
      "htmlType": "DATE",
      "plotType": "CONSENT_DATE",
      "required": "REQUIRED",
      "inputPosition": {
        "top": 0.69921875,
        "left": 0.7,
        "page": 4
      },
      "name": "同意日・時間",
      "target": "PATIENT"
    }
  ]
}`;

    // for await (const chunk of response.textStream) {
    //   jsonText += chunk;
    // }
    // if (jsonText.length === 0) {
    //   throw new Error("JSON text is empty");
    // }
    const jsonTextWithoutCodeBlock = jsonText
      .replace(/```json\n/, "")
      .replace(/\n```/, "");
    const elements = JSON.parse(jsonTextWithoutCodeBlock);
    // const createConsentTemplateInput = {
    //   ...json,
    //   pdfId,
    // } as CreateTemplateInput;
    // const inputPositions = createConsentTemplateInput.elements.map(
    //   (element) => {
    //     const { name, inputPosition } = element;
    //     const { top, left, page } = inputPosition;
    //     return {
    //       name,
    //       top,
    //       left,
    //       page,
    //     };
    //   }
    // );
    // console.log("inputPositions", inputPositions);

    const createConsentTemplateInput = {
      ...elements,
      pdfId,
    } as CreateTemplateInput;
    console.log("createConsentTemplateInput", createConsentTemplateInput);
    return { createConsentTemplateInput };
  },
});

const uploadPdfStep = new Step({
  id: "upload-pdf",
  description: "Upload the pdf file",
  inputSchema: z.object({
    pdfBase64Data: z.string(),
  }),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const pdfBase64Data = context?.getStepResult<{
      pdfBase64Data: string;
    }>("trigger").pdfBase64Data;
    const token = context?.getStepResult<{ token: string }>(
      "staff-login"
    ).token;

    const res = await uploadPdf(
      {
        encodeData: convertBase64ToBinary(pdfBase64Data),
      },
      token
    );
    const pdfId = res.pdfId;
    console.log("pdfId", pdfId);
    return { pdfId };
  },
});

const createConsentTemplateStep = new Step({
  id: "create-consent-template",
  description: "Create the consent template",
  inputSchema: z.object({
    pdfBase64Data: z.string(),
  }),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    const token = context?.getStepResult<{ token: string }>(
      "staff-login"
    ).token;
    const createConsentTemplateInput = context?.getStepResult<{
      createConsentTemplateInput: CreateTemplateInput;
    }>("generate-consent-template-elements").createConsentTemplateInput;
    console.log("createConsentTemplateInput", createConsentTemplateInput);
    // 整形した同意書をアップデートする
    await createConsentTemplate(createConsentTemplateInput, token);
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

const createConsentTemplateWorkflow = new Workflow({
  name: "create-consent-template",
  triggerSchema: z.object({
    email: z.string(),
    password: z.string(),
    pdfBase64Data: z.string(),
  }),
})
  .step(staffLoginStep)
  .then(uploadPdfStep)
  .then(generateConsentTemplateElementsStep)
  .then(createConsentTemplateStep)
  .then(signOutStep);

createConsentTemplateWorkflow.commit();

export { createConsentTemplateWorkflow };
