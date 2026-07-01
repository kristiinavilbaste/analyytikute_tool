import type { Handler } from '@netlify/functions';
import { ApiError, getErrorMessage, getErrorStatusCode } from './_shared/apiErrors';
import {
  REVIEW_BOARD_SYSTEM_PROMPT,
  buildReviewBoardUserPrompt,
} from './_shared/prompts/reviewBoardPrompt';
import { createJsonCompletion, getOpenAiModel, parseJsonResponse } from './_shared/openaiHelpers';
import { normalizeReviewResult } from './_shared/normalizeResponses';

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

  try {
    console.log('hasOpenAIKey:', Boolean(process.env.OPENAI_API_KEY));
    console.log('selected model:', getOpenAiModel());

    const body = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : {};
    console.log('body parsed');

    const analysisInput = String(body.analysisInput ?? '').trim();
    console.log('input text length:', analysisInput.length);

    if (!analysisInput) {
      throw new ApiError('analysisInput is required.', 400);
    }

    console.log('calling OpenAI');
    const content = await createJsonCompletion(
      REVIEW_BOARD_SYSTEM_PROMPT,
      buildReviewBoardUserPrompt(analysisInput),
      { maxTokens: 1200, timeoutMs: 20_000 },
    );
    console.log('OpenAI response received');

    const parsed = parseJsonResponse<Record<string, unknown>>(content);
    const result = normalizeReviewResult(parsed);

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
