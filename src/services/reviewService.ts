import type { ReviewResult, HandoffPack } from '../types';
import {
  runReviewBoard as mockRunReviewBoard,
  generateHandoffPack as mockGenerateHandoffPack,
  generateFigmaPrompt as mockGenerateFigmaPrompt,
} from './mockReviewService';
import {
  runReviewBoardWithAI,
  generateHandoffPackWithAI,
  generateFigmaPromptWithAI,
  isUsingMockAi,
} from './aiReviewService';

/**
 * Review service facade.
 * Components import from this file only — never from mockReviewService or aiReviewService directly.
 */

export interface ReviewServiceOptions {
  forceMock?: boolean;
}

export async function runReviewBoard(
  input: string,
  options?: ReviewServiceOptions,
): Promise<ReviewResult> {
  if (isUsingMockAi() || options?.forceMock) {
    return mockRunReviewBoard(input);
  }
  return runReviewBoardWithAI(input);
}

export async function generateHandoffPack(
  input: string,
  reviewResult?: ReviewResult,
  options?: ReviewServiceOptions,
): Promise<HandoffPack> {
  if (isUsingMockAi() || options?.forceMock) {
    return mockGenerateHandoffPack(input);
  }
  if (!reviewResult) {
    throw new Error('Review result is required to generate an AI handoff pack.');
  }
  return generateHandoffPackWithAI(input, reviewResult);
}

export async function generateFigmaPrompt(
  input: string,
  reviewResult?: ReviewResult,
  options?: ReviewServiceOptions,
): Promise<string> {
  if (isUsingMockAi() || options?.forceMock) {
    return mockGenerateFigmaPrompt(input, reviewResult);
  }
  if (!reviewResult) {
    throw new Error('Review result is required to generate an AI Figma prompt.');
  }
  return generateFigmaPromptWithAI(input, reviewResult);
}

export { isUsingMockAi };
