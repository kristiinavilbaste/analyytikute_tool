import type { ReviewResult, HandoffPack } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class AiServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
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
  return postJson<ReviewResult>('/api/review-board', { analysisInput });
}

export async function generateHandoffPackWithAI(
  analysisInput: string,
  reviewResult: ReviewResult,
): Promise<HandoffPack> {
  return postJson<HandoffPack>('/api/handoff-pack', { analysisInput, reviewResult });
}

export async function generateFigmaPromptWithAI(
  analysisInput: string,
  reviewResult: ReviewResult,
): Promise<string> {
  const result = await postJson<{ prompt: string }>('/api/figma-prompt', {
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
