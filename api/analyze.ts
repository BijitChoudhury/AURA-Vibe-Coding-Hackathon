import { GoogleGenAI, Type } from '@google/genai';
import { runHeuristicScan } from '../src/lib/heuristics.ts';
import { findFallbackPreset } from '../src/data/presets.ts';
import type {
  AnalyzeRequestPayload,
  AnalyzeResponsePayload,
  ImpersonatedEntity,
  ScamAnalysisResult,
  Verdict,
} from '../src/types/scamshield.ts';

const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];

const SYSTEM_INSTRUCTION = `You are ScamShield, a precision cybersecurity and consumer fraud analyst specializing in Indian digital scams (SMS, WhatsApp, phishing links impersonating banks, delivery services, and government organisations).
Analyze the provided text or screenshot together with any detected flags and return ONLY valid JSON:
- risk_score (0-100)
- verdict ("Safe" | "Suspicious" | "High Risk Scam")
- impersonated_entity ("Bank" | "Delivery Service" | "Government" | "Other" | "None")
- extracted_text (exact verbatim message text)
- highlighted_phrases (exact verbatim manipulative/suspicious substrings)
- phrase_annotations (array of { phrase, reason })
- risk_explanation (2-3 simple sentences explaining the threat)
- tactics_used (array of deceptive tactics)
- safe_next_steps (actionable steps including 1930 / cybercrime.gov.in)
Do NOT flag legitimate bank transaction alerts or standard OTPs that have no suspicious links.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    risk_score: { type: Type.INTEGER },
    verdict: { type: Type.STRING },
    impersonated_entity: { type: Type.STRING },
    extracted_text: { type: Type.STRING },
    highlighted_phrases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
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
    },
    risk_explanation: { type: Type.STRING },
    tactics_used: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    safe_next_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
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
    raw === 'Government Organisation' ||
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

async function callGemini(
  ai: GoogleGenAI,
  contents: unknown,
): Promise<{ text: string; modelUsed: string }> {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastErr: unknown;

  for (const model of models) {
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
      if (text) return { text, modelUsed: model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Gemini API call failed');
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key',
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = (req.body || {}) as AnalyzeRequestPayload;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const imageBase64 =
      typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const imageMimeType =
      typeof body.imageMimeType === 'string' ? body.imageMimeType : 'image/png';
    const presetId =
      typeof body.presetId === 'string' ? body.presetId.trim() : undefined;

    if (!message && !imageBase64) {
      res.status(400).json({ error: 'Please provide message text or an image' });
      return;
    }

    const heuristics = body.heuristicReport ?? runHeuristicScan(message);
    const matchedPreset = !imageBase64
      ? findFallbackPreset(presetId, message)
      : undefined;

    const clientKey =
      typeof body.apiKey === 'string' && body.apiKey.trim().length > 0
        ? body.apiKey.trim()
        : typeof req.headers?.['x-gemini-api-key'] === 'string'
          ? req.headers['x-gemini-api-key'].trim()
          : '';

    const apiKey = (
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
        ? process.env.GEMINI_API_KEY
        : clientKey
    ).trim();

    if (!apiKey) {
      if (matchedPreset) {
        const payload: AnalyzeResponsePayload = {
          result: {
            ...matchedPreset.fallbackResult,
            extracted_text: matchedPreset.message,
          },
          heuristics,
          source: 'fallback_preset',
          notice: 'Loaded sample intelligence (API key not configured).',
        };
        res.status(200).json(payload);
        return;
      }
      res.status(503).json({
        error:
          'Live AI analysis requires GEMINI_API_KEY. You can add one via the header button or test any of the 4 samples.',
        heuristics,
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const heuristicSummary = JSON.stringify(
      {
        urls: heuristics.urls.map((u) => ({
          raw: u.raw,
          passed: u.passed,
          reasons: u.reasons,
        })),
        flags: heuristics.flags.map((f) => ({
          label: f.label,
          detail: f.detail,
        })),
        preliminary_heuristic_score: heuristics.heuristicScore,
      },
      null,
      2,
    );

    const promptParts = [
      'Analyze the following input for phishing, social engineering, or scam risk.',
      message ? `Message text:\n"""\n${message}\n"""` : '',
      imageBase64
        ? 'An SMS/WhatsApp screenshot is attached. Transcribe all visible text into extracted_text and complete the assessment.'
        : '',
      `Pre-scan JavaScript heuristic findings:\n${heuristicSummary}`,
    ].filter(Boolean);

    const contents = imageBase64
      ? {
          parts: [
            { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
            { text: promptParts.join('\n\n') },
          ],
        }
      : promptParts.join('\n\n');

    const { text, modelUsed } = await callGemini(ai, contents);
    const parsed = JSON.parse(text);
    const normalized = normalizeAnalysis(parsed, message);

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
    res.status(200).json(payload);
  } catch (err: any) {
    console.error('Vercel API error:', err);
    res.status(500).json({
      error: err?.message || 'Error executing scam analysis',
    });
  }
}
