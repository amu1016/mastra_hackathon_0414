import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { weatherWorkflow } from "./workflows/sample";
import { weatherAgent } from "./agents/sample";
import { cleanUpTemplateAgent } from "./agents/medios/consent/cleanUpTemplate";
import { cleanupConsentTemplateWorkflow } from "./workflows/medios/cleanupConsentTemplate";
import { createConsentTemplateWorkflow } from "./workflows/medios/createConsentTemplate";
import { createTypeformFormFromPdfWorkflow } from "./workflows/typeform/createFormFromPdf";
import { questionExtractionAgent } from "./agents/typeform/questionExtractionAgent";

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    cleanupConsentTemplateWorkflow,
    createConsentTemplateWorkflow,
    createTypeformFormFromPdfWorkflow,
  },
  agents: { weatherAgent, cleanUpTemplateAgent, questionExtractionAgent },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
