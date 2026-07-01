import OpenAI from 'openai';
import { ApiError, mapApiError } from './apiErrors';

const DEFAULT_MODEL = 'gpt-4.1-mini';
const DEFAULT_TIMEOUT_MS = 20_000;

let openaiClient: OpenAI | null = null;
let missingKeyWarningShown = false;

export function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    if (!missingKeyWarningShown) {
      console.warn(
        '[netlify] OPENAI_API_KEY is not set. AI endpoints will return errors until configured.',
      );
      missingKeyWarningShown = true;
    }

    openaiClient ??= new OpenAI({
      apiKey: 'missing-api-key',
      timeout: DEFAULT_TIMEOUT_MS,
    });
    return openaiClient;
  }

  openaiClient ??= new OpenAI({
    apiKey,
    timeout: DEFAULT_TIMEOUT_MS,
  });
  return openaiClient;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

export function assertOpenAiConfigured(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured on the server.');
  }
}

export interface JsonCompletionOptions {
  maxTokens?: number;
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ApiError('AI request timed out before OpenAI returned a response.', 504),
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function createJsonCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: JsonCompletionOptions = {},
): Promise<string> {
  assertOpenAiConfigured();

  const maxTokens = options.maxTokens ?? 1200;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const response = await withTimeout(
      getOpenAiClient().chat.completions.create({
        model: getOpenAiModel(),
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      timeoutMs,
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    return content;
  } catch (error) {
    throw mapApiError(error);
  }
}

export function parseJsonResponse<T>(content: string): T {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error('AI response could not be parsed.');
  }
}
