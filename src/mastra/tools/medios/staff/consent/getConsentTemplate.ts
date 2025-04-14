import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConsentTemplate } from "../../../../repositpry/medios/staff/consent/getConsentTemplate";

export const getConsentTemplateTool = createTool({
  id: "get-consent-template",
  description: "Get consent template",
  inputSchema: z.object({
    id: z.number(),
    token: z.string(),
  }),
  outputSchema: z.object({
    consentTemplate: z.any(),
  }),
  execute: async ({ context }) => {
    const { id, token } = context;
    const consentTemplate = await getConsentTemplate(token, id);
    return {
      consentTemplate,
    };
  },
});
