import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText, type ModelMessage } from 'ai';

const DEFAULT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

export function groqModelChain() {
  return [
    process.env.GROQ_MODEL,
    process.env.GROQ_FALLBACK_MODEL,
    process.env.GROQ_FALLBACK_MODEL_2,
    ...DEFAULT_MODELS,
  ].filter((model, index, models): model is string => Boolean(model) && models.indexOf(model) === index);
}

function createGroqClient() {
  return createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY!,
  });
}

export interface StreamOptions {
  messages: ModelMessage[];
  system: string;
  maxOutputTokens?: number;
  temperature?: number;
  onFinish?: (result: { text: string; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } }) => void | Promise<void>;
}

export async function streamWithFallback(options: StreamOptions) {
  const { messages, system, maxOutputTokens = 2048, temperature = 0.7, onFinish } = options;
  let lastError: Error | null = null;
  const groq = createGroqClient();

  for (const modelId of groqModelChain()) {
    try {
      const result = streamText({
        model: groq(modelId),
        system,
        messages,
        maxOutputTokens,
        temperature,
        onFinish: onFinish
          ? (event) => onFinish({
              text: event.text,
              usage: {
                inputTokens: event.usage.inputTokens,
                outputTokens: event.usage.outputTokens,
                totalTokens: event.usage.totalTokens,
              },
            })
          : undefined,
      });

      return { result, modelId };
    } catch (error) {
      lastError = error as Error;
      console.error(`Groq model ${modelId} failed:`, error);
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function generateWithFallback(options: StreamOptions) {
  const { messages, system, maxOutputTokens = 2048, temperature = 0.7 } = options;
  let lastError: Error | null = null;
  const groq = createGroqClient();

  for (const modelId of groqModelChain()) {
    try {
      const result = await generateText({
        model: groq(modelId),
        system,
        messages,
        maxOutputTokens,
        temperature,
      });
      return { result, modelId };
    } catch (error) {
      lastError = error as Error;
      console.error(`Groq model ${modelId} failed:`, error);
    }
  }

  throw lastError || new Error('All Groq models failed');
}
