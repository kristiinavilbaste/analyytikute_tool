import { createPostHandler } from './_shared/handler';
import { ApiError } from './_shared/apiErrors';
import {
  FIGMA_SYSTEM_PROMPT,
  buildFigmaUserPrompt,
} from './_shared/prompts/figmaPrompt';
import { createJsonCompletion, parseJsonResponse } from './_shared/openaiHelpers';
import { normalizeFigmaPrompt } from './_shared/normalizeResponses';

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
