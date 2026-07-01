import { createPostHandler } from './_shared/handler.js';
import { ApiError } from '../../shared/apiErrors.js';
import {
  FIGMA_SYSTEM_PROMPT,
  buildFigmaUserPrompt,
} from '../../shared/prompts/figmaPrompt.js';
import { createJsonCompletion, parseJsonResponse } from '../../shared/openaiHelpers.js';
import { normalizeFigmaPrompt } from '../../shared/normalizeResponses.js';

export const handler = createPostHandler(async (body) => {
  const analysisInput = String(body.analysisInput ?? '').trim();
  const reviewResult = body.reviewResult;

  if (!analysisInput) {
    throw new ApiError('analysisInput is required.', 400);
  }
  if (!reviewResult || typeof reviewResult !== 'object') {
    throw new ApiError('reviewResult is required.', 400);
  }

  const content = await createJsonCompletion(
    FIGMA_SYSTEM_PROMPT,
    buildFigmaUserPrompt(analysisInput, reviewResult),
  );
  const parsed = parseJsonResponse<Record<string, unknown>>(content);
  return normalizeFigmaPrompt(parsed);
});
