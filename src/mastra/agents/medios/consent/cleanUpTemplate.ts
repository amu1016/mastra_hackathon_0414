import { Agent } from "@mastra/core/agent";
import { google } from "../../../models";
import { staffLoginTool } from "../../../tools/medios/staff/login";
import { getConsentTemplateTool } from "../../../tools/medios/staff/consent/getConsentTemplate";

export const cleanUpTemplateAgent = new Agent({
  name: "Clean Up Template Agent",
  model: google("gemini-2.0-flash-001"),
  instructions: `
    You are a helpful assistant that cleans up templates.
  `,
  tools: {
    staffLoginTool,
    getConsentTemplateTool,
  },
});
