import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { runHeuristicScan } from './src/lib/heuristics.ts';
import { findFallbackPreset } from './src/data/presets.ts';
import type {
  AnalyzeRequestPayload,
  AnalyzeResponsePayload,
  ImpersonatedEntity,
  ScamAnalysisResult,
  Verdict,
} from './src/types/scamshield.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];

const SYSTEM_INSTRUCTION = `You are ScamShield, a precision cybersecurity and consumer fraud analyst specializing in SMS, WhatsApp, and social-engineering scams (including Indian banking KYC scams, courier/India Post redelivery scams, government PM-Kisan / Income Tax .apk scams, and distinguishing legitimate bank alerts with zero false positives).

Analyze the provided message (or screenshot image) together with any pre-detected heuristic URL/pattern flags.

Rules:
1. Be accurate and avoid false positives: standard transactional bank alerts that contain NO phishing links, NO credential requests, NO urgency threats, and remind users never to share OTP/PIN/CVV should score 0-12 with verdict "Safe", impersonated_entity "None", and empty highlighted_phrases and tactics_used.
2. When analyzing an image screenshot, accurately transcribe the core message text into "extracted_text". When analyzing plain text, return the original message in "extracted_text".
3. "highlighted_phrases" MUST contain exact contiguous substrings copied verbatim from "extracted_text" so the UI can highlight them accurately. Keep them focused on the 2-5 most manipulative or dangerous phrases (urgent threats, fake URLs, .apk filenames, OTP/PIN asks, fake fees/refunds). Leave empty if the message is Safe.
4. For each phrase in "highlighted_phrases", include a matching entry in "phrase_annotations" with a short, plain-English tooltip reason (1 sentence, under 22 words).
5. "risk_explanation" must explain in simple, reassuring, non-technical language what actually happens if the user falls for this message (or why it is safe).
6. "safe_next_steps" must provide 3-4 clear, actionable steps. For Suspicious or High Risk Scam verdicts, always include reporting to India's National Cybercrime Helpline 1930 and cybercrime.gov.in.
7. Output strictly valid JSON matching the schema.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    risk_score: {
      type: Type.INTEGER,
      description: 'Risk score from 0 (completely safe) to 100 (confirmed high-risk scam).',
    },
    verdict: {
      type: Type.STRING,
      description: 'Must be exactly one of: "Safe", "Suspicious", "High Risk Scam".',
    },
    impersonated_entity: {
      type: Type.STRING,
      description: 'Must be exactly one of: "Bank", "Delivery Service", "Government", "Other", "None".',
    },
    extracted_text: {
      type: Type.STRING,
      description: 'The exact message text (transcribed verbatim if input was a screenshot).',
    },
    highlighted_phrases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exact verbatim manipulative or risky substrings from extracted_text.',
    },
    phrase_annotations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['phrase', 'reason'],
      },
      description: 'Short plain-language reason for each highlighted phrase.',
    },
    risk_explanation: {
      type: Type.STRING,
      description: 'Plain-language breakdown of what happens if the user falls for this message.',
    },
    tactics_used: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of psychological or technical scam tricks used.',
    },
    safe_next_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Actionable steps including reporting to 1930 / cybercrime.gov.in for scams.',
    },
  },
  required: [
    'risk_score',
    'verdict',
    'impersonated_entity',
    'extracted_text',
    'highlighted_phrases',
    'phrase_annotations',
    'risk_explanation',
    'tactics_used',
    'safe_next_steps',
  ],
};

function sanitizeVerdict(raw: unknown, score: number): Verdict {
  if (raw === 'Safe' || raw === 'Suspicious' || raw === 'High Risk Scam') {
    return raw;
  }
  if (score >= 70) return 'High Risk Scam';
  if (score >= 30) return 'Suspicious';
  return 'Safe';
}

function sanitizeEntity(raw: unknown): ImpersonatedEntity {
  if (
    raw === 'Bank' ||
    raw === 'Delivery Service' ||
    raw === 'Government' ||
    raw === 'Other' ||
    raw === 'None'
  ) {
    return raw;
  }
  return 'Other';
}

function normalizeAnalysis(
  raw: Record<string, unknown>,
  fallbackText?: string,
): ScamAnalysisResult {
  const scoreNum =
    typeof raw.risk_score === 'number' && Number.isFinite(raw.risk_score)
      ? Math.max(0, Math.min(100, Math.round(raw.risk_score)))
      : 50;

  const highlighted = Array.isArray(raw.highlighted_phrases)
    ? raw.highlighted_phrases.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : [];

  const annotations = Array.isArray(raw.phrase_annotations)
    ? raw.phrase_annotations
        .filter(
          (item): item is { phrase: string; reason: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).phrase === 'string' &&
            typeof (item as Record<string, unknown>).reason === 'string',
        )
        .map((item) => ({
          phrase: item.phrase.trim(),
          reason: item.reason.trim(),
        }))
    : [];

  return {
    risk_score: scoreNum,
    verdict: sanitizeVerdict(raw.verdict, scoreNum),
    impersonated_entity: sanitizeEntity(raw.impersonated_entity),
    extracted_text:
      typeof raw.extracted_text === 'string' && raw.extracted_text.trim()
        ? raw.extracted_text.trim()
        : fallbackText?.trim() || '',
    highlighted_phrases: highlighted,
    phrase_annotations: annotations,
    risk_explanation:
      typeof raw.risk_explanation === 'string' && raw.risk_explanation.trim()
        ? raw.risk_explanation.trim()
        : 'Review this message carefully before tapping any links or sharing personal details.',
    tactics_used: Array.isArray(raw.tactics_used)
      ? raw.tactics_used.filter(
          (item): item is string =>
            typeof item === 'string' && item.trim().length > 0,
        )
      : [],
    safe_next_steps: Array.isArray(raw.safe_next_steps)
      ? raw.safe_next_steps.filter(
          (item): item is string =>
            typeof item === 'string' && item.trim().length > 0,
        )
      : [
          'Do not tap links or share OTPs/PINs.',
          'Verify directly via official apps or websites.',
          'Report suspected cyber fraud at 1930 or cybercrime.gov.in.',
        ],
  };
}

function isModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('404') ||
    msg.includes('NOT_FOUND') ||
    msg.toLowerCase().includes('is not found') ||
    msg.toLowerCase().includes('not supported')
  );
}

async function callGeminiWithModelResilience(
  ai: GoogleGenAI,
  contents: unknown,
): Promise<{ text: string; modelUsed: string }> {
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contents as Parameters<
          typeof ai.models.generateContent
        >[0]['contents'],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });
      const text = (response.text ?? '').trim();
      if (!text) {
        throw new Error(`Empty response from ${model}`);
      }
      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (isModelNotFoundError(err)) {
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All Gemini models failed');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/analyze', async (req, res) => {
    const body = (req.body ?? {}) as AnalyzeRequestPayload;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const imageBase64 =
      typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const imageMimeType =
      typeof body.imageMimeType === 'string' &&
      /^image\/(png|jpeg|jpg|webp|gif)$/i.test(body.imageMimeType)
        ? body.imageMimeType
        : 'image/png';
    const presetId =
      typeof body.presetId === 'string' ? body.presetId.trim() : undefined;

    if (!message && !imageBase64) {
      res.status(400).json({
        error: 'Please paste a message/URL or upload a screenshot image to scan.',
      });
      return;
    }

    const heuristics =
      body.heuristicReport ?? runHeuristicScan(message);
    const matchedPreset = !imageBase64
      ? findFallbackPreset(presetId, message)
      : undefined;

    const clientKey =
      typeof body.apiKey === 'string' && body.apiKey.trim().length > 0
        ? body.apiKey.trim()
        : typeof req.headers['x-gemini-api-key'] === 'string'
          ? req.headers['x-gemini-api-key'].trim()
          : '';
    const apiKey = (
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
        ? process.env.GEMINI_API_KEY
        : clientKey
    ).trim();
    const hasUsableKey =
      apiKey.length > 0 && apiKey !== 'MY_GEMINI_API_KEY';

    if (!hasUsableKey) {
      if (matchedPreset) {
        const payload: AnalyzeResponsePayload = {
          result: {
            ...matchedPreset.fallbackResult,
            extracted_text: matchedPreset.message,
          },
          heuristics,
          source: 'fallback_preset',
          notice:
            'Showing pre-built demo intelligence because GEMINI_API_KEY is not configured in this environment.',
        };
        res.json(payload);
        return;
      }

      res.status(503).json({
        error:
          'Live AI analysis requires GEMINI_API_KEY to be configured in Settings > Secrets. You can still test the 4 one-click demo presets or inspect the instant heuristic URL scan.',
        heuristics,
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const heuristicSummary = JSON.stringify(
        {
          urls: heuristics.urls.map((u) => ({
            raw: u.raw,
            passed: u.passed,
            status: u.status,
            reasons: u.reasons,
          })),
          flags: heuristics.flags.map((f) => ({
            label: f.label,
            detail: f.detail,
            severity: f.severity,
          })),
          preliminary_heuristic_score: heuristics.heuristicScore,
        },
        null,
        2,
      );

      const promptLines = [
        'Analyze the following input for phishing, social engineering, or scam risk.',
        message ? `Message text:\n"""\n${message}\n"""` : '',
        imageBase64
          ? 'An SMS or WhatsApp screenshot image is attached. First transcribe all visible message text accurately into extracted_text, inspect any visible sender name, URLs, links, .apk filenames, or urgent requests, and then complete the JSON assessment.'
          : '',
        `Pre-scan JavaScript heuristic findings:\n${heuristicSummary}`,
      ].filter(Boolean);

      const contents = imageBase64
        ? {
            parts: [
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
              {
                text: promptLines.join('\n\n'),
              },
            ],
          }
        : promptLines.join('\n\n');

      const { text, modelUsed } = await callGeminiWithModelResilience(
        ai,
        contents,
      );
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const normalized = normalizeAnalysis(parsed, message);

      // For screenshots, also run the JS heuristic engine on the OCR-extracted text!
      const finalHeuristics =
        imageBase64 && normalized.extracted_text
          ? runHeuristicScan(
              [message, normalized.extracted_text].filter(Boolean).join('\n'),
            )
          : heuristics;

      const payload: AnalyzeResponsePayload = {
        result: normalized,
        heuristics: finalHeuristics,
        source: 'gemini',
        modelUsed,
      };
      res.json(payload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[ScamShield /api/analyze error]', errMsg);

      // Automatic preset fallback when API is rate-limited or unavailable during a live demo
      if (matchedPreset) {
        const isRateLimit =
          errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
        const payload: AnalyzeResponsePayload = {
          result: {
            ...matchedPreset.fallbackResult,
            extracted_text: matchedPreset.message,
          },
          heuristics,
          source: 'fallback_preset',
          notice: isRateLimit
            ? 'Live AI quota temporarily rate-limited — loaded verified demo analysis for this preset.'
            : 'Live AI endpoint temporarily unavailable — loaded verified demo analysis for this preset.',
        };
        res.json(payload);
        return;
      }

      const status =
        errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')
          ? 429
          : errMsg.includes('403') ||
              errMsg.includes('PERMISSION_DENIED') ||
              errMsg.includes('API_KEY_INVALID')
            ? 403
            : 502;

      const userMessage =
        status === 429
          ? 'The Gemini API rate limit was reached. Please wait a moment and try again, or try one of the 4 one-click demo presets.'
          : status === 403
            ? 'Gemini API authentication failed. Please check your GEMINI_API_KEY in Settings > Secrets.'
            : 'Unable to complete live AI analysis right now. Please try again in a moment.';

      res.status(status).json({
        error: userMessage,
        heuristics,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScamShield server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
