import { getOpenAiClient, getOpenAiModel, assertOpenAiConfigured } from '../openaiClient.js';

export async function createJsonCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  assertOpenAiConfigured();

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
}

export function parseJsonResponse<T>(content: string): T {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error('Failed to parse AI response as JSON.');
  }
}
