import { Agent } from "@mastra/core/agent";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { google } from "../../models";

const gemini = google("gemini-2.0-flash-001");

const agent = new Agent({
  name: "Cleanup Consent Template Agent",
  model: gemini,
  instructions: `
    You are a helpful assistant that cleans up consent templates.
  `,
});

const cleanupConsentTemplateWorkflow = new Workflow({
  name: "cleanup-consent-template",
  triggerSchema: z.object({
    id: z.number(),
  }),
});

export { cleanupConsentTemplateWorkflow };
