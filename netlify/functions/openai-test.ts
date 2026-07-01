import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { getErrorMessage } from './_shared/apiErrors';

const TIMEOUT_MS = 15_000;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('OpenAI connectivity test timed out after 15 seconds.'));
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

export const handler: Handler = async (event) => {
  console.log('openai-test started');

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {
      ok: false,
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      error: 'Method not allowed. Use GET.',
    });
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

  console.log('hasOpenAIKey:', hasOpenAIKey);
  console.log('selected model:', model);

  if (!hasOpenAIKey) {
    return jsonResponse(500, {
      ok: false,
      model,
      error: 'OpenAI API key is not configured on the server.',
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: TIMEOUT_MS,
    });

    console.log('calling OpenAI');
    const response = await withTimeout(
      client.chat.completions.create({
        model,
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      }),
      TIMEOUT_MS,
    );
    console.log('OpenAI response received');

    const output = response.choices[0]?.message?.content?.trim() ?? '';

    return jsonResponse(200, {
      ok: true,
      model,
      output,
    });
  } catch (error) {
    console.error(
      'caught error message:',
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      'caught error stack:',
      error instanceof Error ? error.stack : 'no stack',
    );

    return jsonResponse(500, {
      ok: false,
      model,
      error: getErrorMessage(error),
    });
  }
};
