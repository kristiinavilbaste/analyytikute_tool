import type { Handler } from '@netlify/functions';
import { getErrorMessage, getErrorStatusCode } from './apiErrors';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function createPostHandler(
  handler: (body: Record<string, unknown>) => Promise<unknown>,
): Handler {
  return async (event) => {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: CORS_HEADERS,
        body: '',
      };
    }

    if (event.httpMethod !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed.' });
    }

    try {
      const body = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : {};
      const result = await handler(body);
      return jsonResponse(200, result);
    } catch (error) {
      console.error(`[${event.path}]`, error);
      return jsonResponse(getErrorStatusCode(error), {
        error: getErrorMessage(error),
      });
    }
  };
}
