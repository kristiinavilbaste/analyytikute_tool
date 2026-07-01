import type { ReviewResult, HandoffPack } from '../types';
import {
  runReviewBoard as mockRunReviewBoard,
  generateHandoffPack as mockGenerateHandoffPack,
  generateFigmaPrompt as mockGenerateFigmaPrompt,
} from './mockReviewService';

/**
 * Review service facade.
 *
 * Swap the implementation here when adding OpenAI:
 *   - import { openaiRunReviewBoard, openaiGenerateHandoffPack } from './openaiReviewService';
 *   - export const runReviewBoard = openaiRunReviewBoard;
 *
 * Components import from this file only, never from mockReviewService directly.
 */

const USE_MOCK = true;

export async function runReviewBoard(input: string): Promise<ReviewResult> {
  if (USE_MOCK) {
    return mockRunReviewBoard(input);
  }
  // Future: return openaiRunReviewBoard(input);
  throw new Error('OpenAI integration not yet configured');
}

export async function generateHandoffPack(input: string): Promise<HandoffPack> {
  if (USE_MOCK) {
    return mockGenerateHandoffPack(input);
  }
  // Future: return openaiGenerateHandoffPack(input);
  throw new Error('OpenAI integration not yet configured');
}

export async function generateFigmaPrompt(
  input: string,
  reviewResult?: ReviewResult,
): Promise<string> {
  if (USE_MOCK) {
    return mockGenerateFigmaPrompt(input, reviewResult);
  }
  // Future: return openaiGenerateFigmaPrompt(input, reviewResult);
  throw new Error('OpenAI integration not yet configured');
}
