import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { weatherWorkflow } from "./workflows/sample";
import { weatherAgent } from "./agents/sample";
import { cleanUpTemplateAgent } from "./agents/medios/consent/cleanUpTemplate";
import { cleanupConsentTemplateWorkflow } from "./workflows/medios/cleanupConsentTemplate";

export const mastra = new Mastra({
  workflows: { weatherWorkflow, cleanupConsentTemplateWorkflow },
  agents: { weatherAgent, cleanUpTemplateAgent },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
