import type { ReviewResult, HandoffPack } from '../types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'
).replace(/\/$/, '');

export class AiServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
  }
}

function buildUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.replace(/^\//, '');
  return `${API_BASE_URL}/${normalizedEndpoint}`;
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiServiceError(
      'Could not reach the Analysis Review Board API. Make sure the backend server is running.',
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new AiServiceError(
      payload.error ?? `API request failed with status ${response.status}.`,
      response.status,
    );
  }

  return payload as T;
}

export async function runReviewBoardWithAI(analysisInput: string): Promise<ReviewResult> {
  return postJson<ReviewResult>('review-board', { analysisInput });
}

export async function generateHandoffPackWithAI(
  analysisInput: string,
  reviewResult: ReviewResult,
): Promise<HandoffPack> {
  return postJson<HandoffPack>('handoff-pack', { analysisInput, reviewResult });
}

export async function generateFigmaPromptWithAI(
  analysisInput: string,
  reviewResult: ReviewResult,
): Promise<string> {
  const result = await postJson<{ prompt: string }>('figma-prompt', {
    analysisInput,
    reviewResult,
  });
  return result.prompt;
}

export function isUsingMockAi(): boolean {
  return import.meta.env.VITE_USE_MOCK_AI === 'true';
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
