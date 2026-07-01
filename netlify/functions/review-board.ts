import { createPostHandler } from './_shared/handler.js';
import { ApiError } from '../../shared/apiErrors.js';
import {
  REVIEW_BOARD_SYSTEM_PROMPT,
  buildReviewBoardUserPrompt,
} from '../../shared/prompts/reviewBoardPrompt.js';
import { createJsonCompletion, parseJsonResponse } from '../../shared/openaiHelpers.js';
import { normalizeReviewResult } from '../../shared/normalizeResponses.js';

export const handler = createPostHandler(async (body) => {
  const analysisInput = String(body.analysisInput ?? '').trim();
  if (!analysisInput) {
    throw new ApiError('analysisInput is required.', 400);
  }

  const content = await createJsonCompletion(
    REVIEW_BOARD_SYSTEM_PROMPT,
    buildReviewBoardUserPrompt(analysisInput),
  );
  const parsed = parseJsonResponse<Record<string, unknown>>(content);
  return normalizeReviewResult(parsed);
});
