import { createPostHandler } from './_shared/handler';
import { ApiError } from './_shared/apiErrors';
import {
  HANDOFF_SYSTEM_PROMPT,
  buildHandoffUserPrompt,
} from './_shared/prompts/handoffPrompt';
import { createJsonCompletion, parseJsonResponse } from './_shared/openaiHelpers';
import { normalizeHandoffPack } from './_shared/normalizeResponses';

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
