import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { ApiError, getErrorMessage, getErrorStatusCode } from './_shared/apiErrors';
import {
  mapCompactReviewToResult,
  type CompactReviewResponse,
} from './_shared/compactReviewMapper';
import { buildQualityCategoryPromptSection } from './_shared/constants/qualityGateCategories';

const TIMEOUT_MS = 20_000;
const MAX_OUTPUT_TOKENS = 1800;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const SYSTEM_PROMPT =
  'You are an expert business/system analysis reviewer. Return valid compact JSON only. No markdown. Each quality category must have unique rationale, mainGap and recommendation. Do not reuse the same text across categories.';

function buildUserPrompt(analysisInput: string): string {
  const trimmedInput =
    analysisInput.length > 10_000
      ? `${analysisInput.slice(0, 10_000)}\n\n[Input truncated for review.]`
      : analysisInput;

  return `Review the provided analysis and return compact JSON only.

Return ONLY this JSON structure:
{
  "qualityScore": number,
  "readinessStatus": string,
  "executiveSummary": string,
  "qualityCategories": [
    {
      "category": string,
      "score": number,
      "rationale": string,
      "mainGap": string,
      "recommendation": string
    }
  ],
  "issues": [
    { "title": string, "severity": "High" | "Medium" | "Low", "description": string }
  ],
  "risks": [
    { "title": string, "severity": "High" | "Medium" | "Low", "description": string }
  ],
  "hiddenAssumptions": string[],
  "questions": string[],
  "recommendations": string[]
}

qualityCategories must contain exactly 10 items, one for each category below, in this order, using the exact category names.
Each qualityCategories[].score must be 0-10 only. qualityScore is 0-100 overall only.
Do not reuse the same rationale, mainGap or recommendation across categories.
Keep each category text short but specific to that category only.

Required categories:
${buildQualityCategoryPromptSection()}

Maximum items: issues 5, risks 5, hiddenAssumptions 5, questions 5, recommendations 5.
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

function parseCompactReviewJson(content: string): CompactReviewResponse {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as CompactReviewResponse;
  } catch {
    throw new ApiError(
      `AI response could not be parsed. Raw response (first 500 chars): ${content.slice(0, 500)}`,
      500,
    );
  }
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
    if (!content) {
      throw new ApiError('OpenAI returned an empty response.', 500);
    }

    const parsed = parseCompactReviewJson(content);
    const result = mapCompactReviewToResult(parsed);

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
