import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { GoogleGenAI } from "@google/genai";
import { createVertex } from "@ai-sdk/google-vertex";

// Google Gemini AIプロバイダーの作成
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

export const vertex = createVertex({
  project: "librechat-409605",
  location: "us-central1",
});

// エンべディングモデルのインスタンス
export const googleEmbeddingModel =
  google.textEmbeddingModel("text-embedding-004");

// anthropic/claude-3.7-sonnet:thinking
// Claude 3.7 Thinking モデルのインスタンス
export const claudeThinkingModel = "anthropic/claude-3.7-sonnet:thinking";

const openai = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
});

// // OpenRouter経由でのClaude 3.7 Thinkingモデル指定
const openRouterClaudeThinkingModel = "anthropic/claude-3-7-sonnet:thinking";

// // OpenRouter経由でのモデル利用設定
export const openRouter = openai(openRouterClaudeThinkingModel);

// Initialize Vertex with your Cloud project and location
// export const ai = new GoogleGenAI({
//   vertexai: true,
//   project: "contrea-6e19a",
//   location: "us-central1",
// });
