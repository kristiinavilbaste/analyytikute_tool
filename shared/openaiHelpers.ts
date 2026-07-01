import OpenAI from 'openai';
import { mapApiError } from './apiErrors.js';

let openaiClient: OpenAI | null = null;
let missingKeyWarningShown = false;

export function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    if (!missingKeyWarningShown) {
      console.warn(
        '[server] OPENAI_API_KEY is not set. AI endpoints will return errors until configured.',
      );
      missingKeyWarningShown = true;
    }

    openaiClient ??= new OpenAI({ apiKey: 'missing-api-key' });
    return openaiClient;
  }

  openaiClient ??= new OpenAI({ apiKey });
  return openaiClient;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
}

export function assertOpenAiConfigured(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured on the server.');
  }
}

export async function createJsonCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  assertOpenAiConfigured();

  try {
    const response = await getOpenAiClient().chat.completions.create({
      model: getOpenAiModel(),
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

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
