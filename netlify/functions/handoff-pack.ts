import { createPostHandler } from './_shared/handler.js';
import { ApiError } from '../../shared/apiErrors.js';
import {
  HANDOFF_SYSTEM_PROMPT,
  buildHandoffUserPrompt,
} from '../../shared/prompts/handoffPrompt.js';
import { createJsonCompletion, parseJsonResponse } from '../../shared/openaiHelpers.js';
import { normalizeHandoffPack } from '../../shared/normalizeResponses.js';

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
    HANDOFF_SYSTEM_PROMPT,
    buildHandoffUserPrompt(analysisInput, reviewResult),
  );
  const parsed = parseJsonResponse<Record<string, unknown>>(content);
  return normalizeHandoffPack(parsed);
});
