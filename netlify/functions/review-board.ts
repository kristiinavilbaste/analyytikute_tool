import { createPostHandler } from './_shared/handler';
import { ApiError } from './_shared/apiErrors';
import {
  REVIEW_BOARD_SYSTEM_PROMPT,
  buildReviewBoardUserPrompt,
} from './_shared/prompts/reviewBoardPrompt';
import { createJsonCompletion, parseJsonResponse } from './_shared/openaiHelpers';
import { normalizeReviewResult } from './_shared/normalizeResponses';

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
