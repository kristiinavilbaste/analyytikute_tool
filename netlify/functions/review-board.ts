import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { ApiError, getErrorMessage, getErrorStatusCode } from './_shared/apiErrors';
import {
  createFallbackCompactReview,
  mapCompactReviewToResult,
  parseCompactReviewJson,
} from './_shared/compactReviewMapper';

const TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 700;
const MAX_INPUT_CHARS = 4000;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const SYSTEM_PROMPT =
  'You are an expert business/system analysis reviewer. Return valid compact JSON only. No markdown. Keep every string to one short sentence.';

function buildUserPrompt(analysisInput: string): string {
  const trimmedInput =
    analysisInput.length > MAX_INPUT_CHARS
      ? `${analysisInput.slice(0, MAX_INPUT_CHARS)}\n\n[Input truncated for review.]`
      : analysisInput;

  return `Review the analysis and return compact JSON only.

Return ONLY this JSON structure:
{
  "qualityScore": number,
  "readinessStatus": string,
  "executiveSummary": string,
  "topIssues": string[],
  "topRisks": string[],
  "hiddenAssumptions": string[],
  "questions": string[],
  "recommendations": string[]
}

Limits: topIssues max 5, topRisks max 5, hiddenAssumptions max 5, questions max 5, recommendations max 5.
Each array item must be one short sentence only.
qualityScore is 0-100 overall.
readinessStatus must be one of: Not ready, Needs clarification, Ready for refinement, Ready for development.

ANALYSIS:
---
${trimmedInput}
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

export const handler: Handler = async (event) => {
  console.log('review-board started');
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
      function: 'review-board',
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
    console.log('input text length:', analysisInput.length);

    if (!analysisInput) {
      throw new ApiError('analysisInput is required.', 400);
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
          { role: 'user', content: buildUserPrompt(analysisInput) },
        ],
      }),
      TIMEOUT_MS,
    );
    console.log('OpenAI response received');

    const content = response.choices[0]?.message?.content?.trim() ?? '';
    console.log('raw output first 200 chars:', content.slice(0, 200));

    const parsed = content ? parseCompactReviewJson(content) : null;
    const compact = parsed ?? createFallbackCompactReview();

    if (!parsed) {
      console.log('AI JSON parse failed, using fallback review object');
    }

    const result = mapCompactReviewToResult(compact);

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
