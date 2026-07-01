import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import { getErrorMessage } from './_shared/apiErrors';

const TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 500;
const MAX_INPUT_CHARS = 4000;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const SYSTEM_PROMPT =
  'You are a senior business/system analyst. Return valid JSON only.';

const PARSE_FALLBACK = {
  handoffSummary:
    'AI returned a non-JSON response, but the handoff pack could not be parsed.',
  developerScope: [] as string[],
  userStories: [] as Array<{ title: string; acceptanceCriteria: string[] }>,
  openQuestions: [] as string[],
  technicalRisks: [] as string[],
};

interface CompactHandoff {
  handoffSummary: string;
  developerScope: string[];
  userStories: Array<{ title: string; acceptanceCriteria: string[] }>;
  openQuestions: string[];
  technicalRisks: string[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Handoff pack request timed out after 25 seconds.'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function extractAnalysisText(body: Record<string, unknown>): string {
  const candidates = [
    body.analysisInput,
    body.analysisText,
    body.text,
    body.analysis,
    body.input,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (value) return value;
  }

  return '';
}

function buildUserPrompt(analysisText: string): string {
  return `Create a very concise developer handoff pack from this analysis.

Return this JSON only:
{
  "handoffSummary": "one sentence",
  "developerScope": ["max 3 short items"],
  "userStories": [
    {
      "title": "short title",
      "acceptanceCriteria": ["max 3 short criteria"]
    }
  ],
  "openQuestions": ["max 3 short questions"],
  "technicalRisks": ["max 3 short risks"]
}

Analysis:
${analysisText}`;
}

function parseCompactHandoff(content: string): CompactHandoff {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Partial<CompactHandoff>;
    return {
      handoffSummary: String(parsed.handoffSummary ?? PARSE_FALLBACK.handoffSummary),
      developerScope: Array.isArray(parsed.developerScope)
        ? parsed.developerScope.map(String).slice(0, 3)
        : [],
      userStories: Array.isArray(parsed.userStories)
        ? parsed.userStories.slice(0, 3).map((story) => ({
            title: String(story?.title ?? 'User story'),
            acceptanceCriteria: Array.isArray(story?.acceptanceCriteria)
              ? story.acceptanceCriteria.map(String).slice(0, 3)
              : [],
          }))
        : [],
      openQuestions: Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions.map(String).slice(0, 3)
        : [],
      technicalRisks: Array.isArray(parsed.technicalRisks)
        ? parsed.technicalRisks.map(String).slice(0, 3)
        : [],
    };
  } catch {
    return { ...PARSE_FALLBACK };
  }
}

function mapToHandoffPack(compact: CompactHandoff) {
  const userStories = compact.userStories.map((story) => {
    if (story.acceptanceCriteria.length > 0) {
      return `${story.title} (Acceptance: ${story.acceptanceCriteria.join('; ')})`;
    }
    return story.title;
  });

  const acceptanceCriteria = compact.userStories.flatMap((story) => story.acceptanceCriteria);

  return {
    featureSummary: compact.handoffSummary,
    businessGoal: compact.handoffSummary,
    scope: compact.developerScope,
    outOfScope: [],
    userRoles: ['Confirm user roles during refinement.'],
    functionalRequirements:
      compact.userStories.length > 0
        ? compact.userStories.map((s) => s.title)
        : ['Define functional requirements during refinement.'],
    nonFunctionalRequirements: ['Define non-functional requirements during refinement.'],
    businessRules: ['Document business rules during refinement.'],
    dataAndIntegrations: ['Confirm data and integrations during refinement.'],
    userStories: userStories.length > 0 ? userStories : ['Draft user stories during refinement.'],
    acceptanceCriteria:
      acceptanceCriteria.length > 0
        ? acceptanceCriteria
        : ['Add acceptance criteria during refinement.'],
    edgeCases: ['Identify edge cases during refinement.'],
    risks:
      compact.technicalRisks.length > 0
        ? compact.technicalRisks
        : ['Review technical risks with the delivery team.'],
    openQuestions:
      compact.openQuestions.length > 0
        ? compact.openQuestions
        : ['Confirm open questions with stakeholders.'],
    technicalNotes:
      compact.technicalRisks.length > 0
        ? compact.technicalRisks
        : ['Add technical notes during solution design.'],
    recommendationForRefinement:
      compact.openQuestions[0] ??
      'Complete a refinement workshop before development handoff.',
  };
}

export const handler: Handler = async (event) => {
  console.log('handoff-pack started');
  console.log('request method:', event.httpMethod);

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    return jsonResponse(200, {
      ok: true,
      function: 'handoff-pack',
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model,
    });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  console.log('hasOpenAIKey:', Boolean(process.env.OPENAI_API_KEY));
  console.log('selected model:', model);

  try {
    const body = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : {};
    console.log('body parsed');

    const analysisText = extractAnalysisText(body);
    console.log('input text length:', analysisText.length);

    if (!analysisText) {
      return jsonResponse(400, {
        error:
          'Analysis text is required. Provide analysisInput, analysisText, text, analysis, or input.',
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return jsonResponse(500, {
        error: 'OpenAI API key is not configured on the server.',
      });
    }

    const truncatedText =
      analysisText.length > MAX_INPUT_CHARS
        ? `${analysisText.slice(0, MAX_INPUT_CHARS)}\n[Truncated.]`
        : analysisText;
    console.log('truncated input length:', truncatedText.length);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: TIMEOUT_MS,
    });

    console.log('calling OpenAI');
    const response = await withTimeout(
      client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(truncatedText) },
        ],
      }),
      TIMEOUT_MS,
    );
    console.log('OpenAI response received');

    const output = response.choices[0]?.message?.content?.trim() ?? '';
    console.log('raw output first 200 chars:', output.slice(0, 200));

    const compact = output ? parseCompactHandoff(output) : { ...PARSE_FALLBACK };
    const result = mapToHandoffPack(compact);

    console.log('returning response');
    return jsonResponse(200, result);
  } catch (error) {
    console.error(
      'caught error message:',
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      'caught error stack:',
      error instanceof Error ? error.stack : 'no stack',
    );

    const message = getErrorMessage(error);
    const statusCode = message.toLowerCase().includes('timed out') ? 504 : 500;

    return jsonResponse(statusCode, { error: message });
  }
};
