// Placeholder for future OpenAI API integration.
//
// Implementation outline:
// 1. Create openaiReviewService.ts with functions matching reviewService signatures.
// 2. Use structured JSON output (response_format: { type: 'json_object' }) with
//    prompts that reference the ReviewResult and HandoffPack TypeScript types.
// 3. For production, call OpenAI from a backend proxy to keep API keys server-side.
// 4. Set USE_MOCK = false in reviewService.ts and wire exports to this module.
//
// export async function openaiRunReviewBoard(input: string): Promise<ReviewResult> { ... }
// export async function openaiGenerateHandoffPack(input: string): Promise<HandoffPack> { ... }
// export async function openaiGenerateFigmaPrompt(input: string, reviewResult?: ReviewResult): Promise<string> { ... }

export {};
