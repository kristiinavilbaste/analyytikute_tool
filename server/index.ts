import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(serverDir, '..');

dotenv.config({ path: resolve(projectRoot, '.env') });

// Dynamic imports below ensure dotenv.config() runs before any module reads process.env.
const { default: express } = await import('express');
const { default: cors } = await import('cors');
const {
  REVIEW_BOARD_SYSTEM_PROMPT,
  buildReviewBoardUserPrompt,
} = await import('./prompts/reviewBoardPrompt.js');
const {
  HANDOFF_SYSTEM_PROMPT,
  buildHandoffUserPrompt,
} = await import('./prompts/handoffPrompt.js');
const {
  FIGMA_SYSTEM_PROMPT,
  buildFigmaUserPrompt,
} = await import('./prompts/figmaPrompt.js');
const { createJsonCompletion, parseJsonResponse } = await import('./utils/openaiHelpers.js');
const {
  normalizeReviewResult,
  normalizeHandoffPack,
  normalizeFigmaPrompt,
} = await import('./utils/normalizeResponses.js');

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ],
  }),
);
app.use(express.json({ limit: '2mb' }));

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected server error.';
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.post('/api/review-board', async (req, res) => {
  try {
    const analysisInput = String(req.body?.analysisInput ?? '').trim();
    if (!analysisInput) {
      res.status(400).json({ error: 'analysisInput is required.' });
      return;
    }

    const content = await createJsonCompletion(
      REVIEW_BOARD_SYSTEM_PROMPT,
      buildReviewBoardUserPrompt(analysisInput),
    );
    const parsed = parseJsonResponse<Record<string, unknown>>(content);
    const result = normalizeReviewResult(parsed);

    res.json(result);
  } catch (error) {
    console.error('[review-board]', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/handoff-pack', async (req, res) => {
  try {
    const analysisInput = String(req.body?.analysisInput ?? '').trim();
    const reviewResult = req.body?.reviewResult;

    if (!analysisInput) {
      res.status(400).json({ error: 'analysisInput is required.' });
      return;
    }
    if (!reviewResult || typeof reviewResult !== 'object') {
      res.status(400).json({ error: 'reviewResult is required.' });
      return;
    }

    const content = await createJsonCompletion(
      HANDOFF_SYSTEM_PROMPT,
      buildHandoffUserPrompt(analysisInput, reviewResult),
    );
    const parsed = parseJsonResponse<Record<string, unknown>>(content);
    const result = normalizeHandoffPack(parsed);

    res.json(result);
  } catch (error) {
    console.error('[handoff-pack]', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.post('/api/figma-prompt', async (req, res) => {
  try {
    const analysisInput = String(req.body?.analysisInput ?? '').trim();
    const reviewResult = req.body?.reviewResult;

    if (!analysisInput) {
      res.status(400).json({ error: 'analysisInput is required.' });
      return;
    }
    if (!reviewResult || typeof reviewResult !== 'object') {
      res.status(400).json({ error: 'reviewResult is required.' });
      return;
    }

    const content = await createJsonCompletion(
      FIGMA_SYSTEM_PROMPT,
      buildFigmaUserPrompt(analysisInput, reviewResult),
    );
    const parsed = parseJsonResponse<Record<string, unknown>>(content);
    const result = normalizeFigmaPrompt(parsed);

    res.json(result);
  } catch (error) {
    console.error('[figma-prompt]', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Analysis Review Board API listening on http://localhost:${PORT}`);
});
