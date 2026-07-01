import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { ApiError, getErrorMessage, getErrorStatusCode } from './_shared/apiErrors';
import {
  mapCompactHandoffToPack,
  type CompactHandoffResponse,
} from './_shared/compactHandoffMapper';

const TIMEOUT_MS = 20_000;
const MAX_OUTPUT_TOKENS = 1200;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const SYSTEM_PROMPT =
  'You are an expert business/system analyst preparing a developer handoff pack. Return valid compact JSON only. No markdown. Keep all text short and demo-friendly.';

function buildUserPrompt(analysisInput: string, reviewResult: unknown): string {
  const trimmedInput =
    analysisInput.length > 8_000
      ? `${analysisInput.slice(0, 8_000)}\n\n[Input truncated for handoff.]`
      : analysisInput;

  const reviewContext =
    reviewResult && typeof reviewResult === 'object'
      ? JSON.stringify(reviewResult).slice(0, 4_000)
      : '';

  return `Create a compact developer handoff pack from the provided analysis. Return valid compact JSON only.

Return ONLY this JSON structure:
{
  "handoffSummary": string,
  "scope": string[],
  "outOfScope": string[],
  "userStories": [
    {
      "title": string,
      "description": string,
      "acceptanceCriteria": string[]
    }
  ],
  "apiAndIntegrationNotes": string[],
  "dataNotes": string[],
  "openQuestions": string[],
  "developerRisks": string[],
  "testingNotes": string[]
}

Limits (do not exceed):
- scope: 5
- outOfScope: 5
- userStories: 5
- acceptanceCriteria per story: 5
- apiAndIntegrationNotes: 5
- dataNotes: 5
- openQuestions: 5
- developerRisks: 5
- testingNotes: 5

ANALYSIS INPUT:
---
${trimmedInput}
---

REVIEW CONTEXT (if useful):
---
${reviewContext || 'Not provided.'}
---`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      reject(new Error('AI request timed out before OpenAI returned a response.'));
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

function parseCompactHandoffJson(content: string): CompactHandoffResponse {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as CompactHandoffResponse;
  } catch {
    throw new ApiError(
      `AI response could not be parsed. Raw response (first 500 chars): ${content.slice(0, 500)}`,
      500,
    );
  }
}

export const handler: Handler = async (event) => {
  console.log('handoff-pack started');
  console.log('request method:', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    return jsonResponse(200, {
      ok: true,
      function: 'handoff-pack',
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || null,
    });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  try {
    console.log('hasOpenAIKey:', Boolean(process.env.OPENAI_API_KEY));
    console.log('selected model:', model);

    const body = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : {};
    console.log('body parsed');

    const analysisInput = String(body.analysisInput ?? '').trim();
    const reviewResult = body.reviewResult;
    console.log('input text length:', analysisInput.length);

    if (!analysisInput) {
      throw new ApiError('analysisInput is required.', 400);
    }
    if (!reviewResult || typeof reviewResult !== 'object') {
      throw new ApiError('reviewResult is required.', 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError('OpenAI API key is not configured on the server.', 500);
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: TIMEOUT_MS,
    });

    console.log('calling OpenAI');
    const response = await withTimeout(
      client.chat.completions.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(analysisInput, reviewResult) },
        ],
      }),
      TIMEOUT_MS,
    );
    console.log('OpenAI response received');

    const content = response.choices[0]?.message?.content?.trim() ?? '';
    if (!content) {
      throw new ApiError('OpenAI returned an empty response.', 500);
    }

    const parsed = parseCompactHandoffJson(content);
    const result = mapCompactHandoffToPack(parsed);

    console.log('returning response');
    return jsonResponse(200, result);
  } catch (error) {
    console.error(
      'caught error message:',
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      'caught error stack:',
      error instanceof Error ? error.stack : 'no stack',
    );

    return jsonResponse(getErrorStatusCode(error), {
      error: getErrorMessage(error),
    });
  }
};
