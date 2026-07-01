export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

const MISSING_KEY_MESSAGE = 'OpenAI API key is not configured on the server.';
const PARSE_ERROR_MESSAGE = 'AI response could not be parsed.';
const RATE_LIMIT_MESSAGE =
  'OpenAI rate limit or quota reached. Please wait a moment and try again.';

export function mapApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    if (
      error.message.includes('OPENAI_API_KEY is not configured') ||
      error.message.includes(MISSING_KEY_MESSAGE)
    ) {
      return new ApiError(MISSING_KEY_MESSAGE, 500);
    }

    if (
      error.message.includes('Failed to parse AI response') ||
      error.message.includes(PARSE_ERROR_MESSAGE)
    ) {
      return new ApiError(PARSE_ERROR_MESSAGE, 500);
    }
  }

  const openAiError = error as {
    status?: number;
    code?: string;
    message?: string;
    error?: { code?: string; message?: string };
  };

  const status = openAiError.status;
  const code = openAiError.code ?? openAiError.error?.code ?? '';
  const message = openAiError.message ?? openAiError.error?.message ?? '';

  if (
    status === 429 ||
    code === 'rate_limit_exceeded' ||
    code === 'insufficient_quota' ||
    message.toLowerCase().includes('rate limit') ||
    message.toLowerCase().includes('quota')
  ) {
    return new ApiError(RATE_LIMIT_MESSAGE, 429);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }

  return new ApiError('Unexpected server error.', 500);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return mapApiError(error).message;
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  return mapApiError(error).statusCode;
}
