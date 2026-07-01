import OpenAI from 'openai';

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
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }
}
