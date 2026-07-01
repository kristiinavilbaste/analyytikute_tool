import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import {
  REVIEW_BOARD_SYSTEM_PROMPT,
  buildReviewBoardUserPrompt,
} from '../shared/prompts/reviewBoardPrompt.js';
import {
  HANDOFF_SYSTEM_PROMPT,
  buildHandoffUserPrompt,
} from '../shared/prompts/handoffPrompt.js';
import {
  FIGMA_SYSTEM_PROMPT,
  buildFigmaUserPrompt,
} from '../shared/prompts/figmaPrompt.js';
import { createJsonCompletion, parseJsonResponse } from '../shared/openaiHelpers.js';
import {
  normalizeReviewResult,
  normalizeHandoffPack,
  normalizeFigmaPrompt,
} from '../shared/normalizeResponses.js';
import {
  ApiError,
  getErrorMessage,
  getErrorStatusCode,
} from '../shared/apiErrors.js';

const serverDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(serverDir, '..');

dotenv.config({ path: resolve(projectRoot, '.env') });

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
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
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
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
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
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Analysis Review Board API listening on http://localhost:${PORT}`);
});
