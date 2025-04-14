import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { weatherWorkflow } from "./workflows";
import { weatherAgent } from "./agents/sample";
import { cleanUpTemplateAgent } from "./agents/medios/consent/cleanUpTemplate";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, cleanUpTemplateAgent },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
