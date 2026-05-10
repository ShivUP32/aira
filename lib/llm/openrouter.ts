import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type ModelMessage } from 'ai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'Aira — Your Board Exam Buddy',
  },
});

export const MODELS = {
  primary: 'google/gemini-2.0-flash-001',
  fallback1: 'meta-llama/llama-4-maverick',
  fallback2: 'deepseek/deepseek-chat-v3-5',
  fallback3: 'mistralai/mistral-small-3.2-24b-instruct',
} as const;

export type ModelKey = keyof typeof MODELS;

const MODEL_LIST: string[] = [
  MODELS.primary,
  MODELS.fallback1,
  MODELS.fallback2,
  MODELS.fallback3,
];

export interface StreamOptions {
  messages: ModelMessage[];
  system: string;
  maxOutputTokens?: number;
  temperature?: number;
  onFinish?: (result: { text: string; usage?: { inputTokens?: number; outputTokens?: number } }) => void;
}

export async function streamWithFallback(options: StreamOptions) {
  const { messages, system, maxOutputTokens = 2048, temperature = 0.7, onFinish } = options;

  let lastError: Error | null = null;

  for (const modelId of MODEL_LIST) {
    try {
      const result = streamText({
        model: openrouter(modelId),
        system,
        messages,
        maxOutputTokens,
        temperature,
        onFinish: onFinish
          ? (event) => onFinish({ text: event.text, usage: { inputTokens: event.usage.inputTokens, outputTokens: event.usage.outputTokens } })
          : undefined,
      });

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Model ${modelId} failed:`, error);
      continue;
    }
  }

  throw lastError || new Error('All models failed');
}
