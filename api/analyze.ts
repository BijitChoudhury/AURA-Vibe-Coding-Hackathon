import { GoogleGenAI } from '@google/genai';

export type Verdict = 'Safe' | 'Suspicious' | 'High Risk Scam';
export type ImpersonatedEntity =
  | 'Bank'
  | 'Delivery Service'
  | 'Government'
  | 'Government Organisation'
  | 'Other'
  | 'None';

export interface HeuristicUrlCheck {
  raw: string;
  hasSuspiciousTld: boolean;
  isShortener: boolean;
  hasApk: boolean;
  isHttps: boolean;
  isTrusted: boolean;
  passed: boolean;
  reasons: string[];
}

export interface HeuristicFlag {
  label: string;
  detail: string;
  weight: number;
}

export interface HeuristicReport {
  urls: HeuristicUrlCheck[];
  flags: HeuristicFlag[];
  hasUrgency: boolean;
  hasApkDownload: boolean;
  hasShortener: boolean;
  hasUnverifiedDomain: boolean;
  heuristicScore: number;
}

export interface ScamAnalysisResult {
  risk_score: number;
  verdict: Verdict;
  impersonated_entity: ImpersonatedEntity;
  extracted_text: string;
  highlighted_phrases: string[];
  phrase_annotations: { phrase: string; reason: string }[];
  risk_explanation: string;
  tactics_used: string[];
  safe_next_steps: string[];
}

export interface AnalyzeRequestPayload {
  message?: string;
  imageBase64?: string;
  imageMimeType?: string;
  presetId?: string;
  apiKey?: string;
  heuristicReport?: HeuristicReport;
}

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rb.gy', 'cutt.ly', 'is.gd',
  'shorturl.at', 'ow.ly', 'tiny.cc', 'rebrand.ly', 'bitly.com', 'short.link', 's.id',
]);

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.click', '.loan', '.buzz', '.gq', '.tk', '.ml', '.cf',
  '.work', '.icu', '.vip', '.cc', '.site', '.online', '.club', '.rest', '.cam',
];

const OFFICIAL_TRUSTED_DOMAINS = [
  'onlinesbi.sbi', 'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
  'kotak.com', 'indiapost.gov.in', 'incometax.gov.in', 'pmkisan.gov.in',
  'cybercrime.gov.in', 'rbi.org.in', 'uidai.gov.in', 'npci.org.in',
];

const URL_REGEX =
  /(?:https?:\/\/[^\s<>"')]+|(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|in|org|net|gov\.in|co\.in|ly|xyz|top|click|loan|buzz|gq|tk|ml|cf|work|icu|vip|cc|site|online|club|me|io|co|at|gd|gy)(?:\/[^\s<>"')]*)?)/gi;

function cleanMatchedUrl(raw: string): string {
  return raw.replace(/[),.;:!?]+$/g, '');
}

function isTrustedDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return OFFICIAL_TRUSTED_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`),
  );
}

function evaluateUrl(rawInput: string): HeuristicUrlCheck {
  const raw = cleanMatchedUrl(rawInput);
  const hasProtocol = /^https?:\/\//i.test(raw);
  const normalized = hasProtocol ? raw : `https://${raw}`;
  const reasons: string[] = [];

  let isHttps = false;
  let hasSuspiciousTld = false;
  let isShortener = false;
  let hasApk = /\.apk(?:\?|$)/i.test(raw);
  let isTrusted = false;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    isHttps = parsed.protocol === 'https:';
    isTrusted = isTrustedDomain(host);

    if (isTrusted) {
      return {
        raw,
        hasSuspiciousTld: false,
        isShortener: false,
        hasApk: false,
        isHttps,
        isTrusted: true,
        passed: true,
        reasons: ['Verified legitimate domain'],
      };
    }

    if (!isHttps && hasProtocol) {
      reasons.push('Insecure connection (HTTP instead of HTTPS)');
    }

    if (URL_SHORTENERS.has(host) || Array.from(URL_SHORTENERS).some((s) => host.endsWith(`.${s}`))) {
      isShortener = true;
      reasons.push('URL shortener conceals the true destination');
    }

    if (SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))) {
      hasSuspiciousTld = true;
      reasons.push('Uses a high-risk domain extension commonly linked to scam portals');
    }

    if (hasApk) {
      reasons.push('Direct Android package (.apk) download link');
    }

    if (reasons.length === 0) {
      reasons.push('Unverified third-party domain');
    }
  } catch {
    reasons.push('Unparseable or malformed web address');
  }

  const passed = isTrusted || (!hasSuspiciousTld && !isShortener && !hasApk && reasons.length === 0);
  return { raw, hasSuspiciousTld, isShortener, hasApk, isHttps, isTrusted, passed, reasons };
}

function runHeuristicScan(message: string): HeuristicReport {
  const text = message || '';
  const urlMatches = text.match(URL_REGEX) || [];
  const uniqueUrls = Array.from(new Set(urlMatches.map(cleanMatchedUrl)));
  const evaluatedUrls = uniqueUrls.map(evaluateUrl);

  const flags: HeuristicFlag[] = [];
  let scoreAccumulator = 0;

  const hasShortener = evaluatedUrls.some((u) => u.isShortener);
  const hasSuspiciousTld = evaluatedUrls.some((u) => u.hasSuspiciousTld);
  const hasApkDownload = evaluatedUrls.some((u) => u.hasApk) || /\b[\w-]+\.apk\b/i.test(text);

  if (hasShortener) {
    flags.push({ label: 'Masked URL Link', detail: 'Message employs link shorteners to obfuscate final destination.', weight: 35 });
    scoreAccumulator += 35;
  }
  if (hasSuspiciousTld) {
    flags.push({ label: 'Dangerous Domain Extension', detail: 'URL uses a TLD heavily abused in cyber fraud campaigns.', weight: 30 });
    scoreAccumulator += 30;
  }
  if (hasApkDownload) {
    flags.push({ label: 'Malware Sideload Risk', detail: 'Directs victim to download an untrusted Android APK file.', weight: 45 });
    scoreAccumulator += 45;
  }

  const lower = text.toLowerCase();
  const urgencyKeywords = ['immediately', 'within 24 hours', 'blocked', 'suspended', 'urgent', 'action required'];
  const hasUrgency = urgencyKeywords.some((w) => lower.includes(w));
  if (hasUrgency) {
    flags.push({ label: 'Panic Trigger / Urgency', detail: 'Artificial urgency designed to bypass critical thinking.', weight: 20 });
    scoreAccumulator += 20;
  }

  return {
    urls: evaluatedUrls,
    flags,
    hasUrgency,
    hasApkDownload,
    hasShortener,
    hasUnverifiedDomain: hasSuspiciousTld || hasShortener,
    heuristicScore: Math.min(100, scoreAccumulator),
  };
}

const PRESET_FALLBACKS: Record<string, ScamAnalysisResult> = {
  'bank-kyc': {
    risk_score: 92,
    verdict: 'High Risk Scam',
    impersonated_entity: 'Bank',
    extracted_text: 'Dear Customer, Your SBI account will be blocked within 24 hours due to incomplete KYC verification. Update your KYC immediately to avoid service disruption: http://sbi-kyc-update.xyz/verify?ref=KYC2026 . Call 9876543210 for assistance. -SBI Team',
    highlighted_phrases: [
      'Your SBI account will be blocked within 24 hours',
      'incomplete KYC verification',
      'Update your KYC immediately',
      'Call 9876543210 for assistance',
    ],
    phrase_annotations: [
      { phrase: 'Your SBI account will be blocked within 24 hours', reason: 'Artificial urgency designed to cause panic before you check official channels.' },
      { phrase: 'incomplete KYC verification', reason: 'Common phishing lure claiming regulatory compliance issues.' },
      { phrase: 'Update your KYC immediately', reason: 'High-pressure call to action urging immediate compliance.' },
      { phrase: 'Call 9876543210 for assistance', reason: 'Fake support number routing directly to criminal phone operators.' },
    ],
    risk_explanation: 'This message impersonates State Bank of India and threatens to block your account to create panic. The URL sbi-kyc-update.xyz is NOT an official SBI domain — it leads to a phishing page designed to steal your Internet Banking credentials, debit card details, and OTP. Banks never ask customers to update KYC via SMS links.',
    tactics_used: ['Artificial Urgency', 'Lookalike Domain (.xyz TLD)', 'Fear of Account Loss', 'Fake Customer Support Number', 'Brand Impersonation (SBI)'],
    safe_next_steps: [
      'Do NOT click the link or call the number in this message.',
      'Report this SMS to SBI by forwarding it to 9223766666 or calling their official helpline 1800-11-2211.',
      'File a complaint at https://cybercrime.gov.in or call the national cyber helpline 1930.',
      'Check your KYC status only via the official SBI YONO app or by visiting your branch in person.',
    ],
  },
  'delivery-courier': {
    risk_score: 88,
    verdict: 'High Risk Scam',
    impersonated_entity: 'Delivery Service',
    extracted_text: 'India Post: Your package #IN4829371 cannot be delivered due to incomplete address information. Please update your delivery details within 24hrs: https://bit.ly/indiapost-redeliver to avoid return to sender. -India Post',
    highlighted_phrases: ['cannot be delivered', 'incomplete address information', 'update your delivery details within 24hrs', 'avoid return to sender'],
    phrase_annotations: [
      { phrase: 'cannot be delivered', reason: 'Generic failure notification sent en masse to catch package recipients.' },
      { phrase: 'incomplete address information', reason: 'Bait to solicit personal delivery and payment address details.' },
      { phrase: 'update your delivery details within 24hrs', reason: 'Arbitrary 24-hour deadline to prevent independent verification.' },
      { phrase: 'avoid return to sender', reason: 'Creates fear of lost merchandise or delayed parcels.' },
    ],
    risk_explanation: 'This message impersonates India Post using a fake delivery failure notification. The bit.ly shortened link hides a fraudulent checkout website where victims are asked to pay a tiny fee (₹5–₹25) for redelivery, capturing debit card numbers and OTPs.',
    tactics_used: ['Artificial Urgency', 'URL Shortener Obfuscation (bit.ly)', 'Brand Impersonation (India Post)', 'Fear of Loss', 'Micro-Payment Credential Trap'],
    safe_next_steps: [
      'Never click shortened links claiming to be from postal or courier services.',
      'Track packages only on the official website: https://www.indiapost.gov.in.',
      'India Post never charges redelivery fees via SMS links.',
      'Report phishing SMS to cybercrime portal (1930).',
    ],
  },
  'govt-pmkisan': {
    risk_score: 95,
    verdict: 'High Risk Scam',
    impersonated_entity: 'Government Organisation',
    extracted_text: 'PM-Kisan Yojana: Congratulations! ₹6000 has been credited to your account under PM Kisan Samman Nidhi. Download the verification app to claim your payment: https://pm-kisan-verify.top/app.apk . Share this message with your family members! -Ministry of Agriculture',
    highlighted_phrases: ['Congratulations! ₹6000 has been credited', 'Download the verification app', 'https://pm-kisan-verify.top/app.apk', 'Share this message with your family members'],
    phrase_annotations: [
      { phrase: 'Congratulations! ₹6000 has been credited', reason: 'Financial reward hook exploiting government welfare schemes.' },
      { phrase: 'Download the verification app', reason: 'Malware delivery trick instructing you to install untrusted software.' },
      { phrase: 'https://pm-kisan-verify.top/app.apk', reason: 'Direct Android APK file on an unofficial .top domain.' },
      { phrase: 'Share this message with your family members', reason: 'Viral chain forwarding tactic to propagate the scam.' },
    ],
    risk_explanation: 'This scam exploits Indian government welfare schemes (PM-Kisan) by offering fake monetary benefits. The link downloads an untrusted Android .apk file containing spyware/banking trojans that read SMS OTPs and execute unauthorized bank transfers.',
    tactics_used: ['Government Scheme Exploitation', 'Malicious .APK Sideloading', 'Suspicious TLD (.top)', 'Financial Lure', 'Viral Chain-Forwarding'],
    safe_next_steps: [
      'DO NOT download or install the .apk file — it is banking malware.',
      'Check genuine PM-Kisan status only at https://pmkisan.gov.in.',
      'Report it on cybercrime.gov.in / 1930.',
    ],
  },
  'genuine-bank': {
    risk_score: 5,
    verdict: 'Safe',
    impersonated_entity: 'None',
    extracted_text: 'SBI: INR 2,500.00 debited from A/c XX4821 on 21-11-2026. Info: UPI/SWIGGY. If not done by you, call 1800111109. Available bal: INR 15,432.50 -SBI',
    highlighted_phrases: [],
    phrase_annotations: [],
    risk_explanation: 'This is a standard, legitimate debit alert from State Bank of India. It contains no clickable links, requests no action unless unauthorized, references legitimate transactions, and directs fraud disputes to official toll-free numbers.',
    tactics_used: [],
    safe_next_steps: [
      'No immediate action required if you made this transaction.',
      'If you did not authorize this payment, call SBI immediately at 1800-11-1109.',
      'Always verify transactions in your bank passbook or official banking app.',
    ],
  },
};

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

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
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const imageMimeType = typeof body.imageMimeType === 'string' ? body.imageMimeType : 'image/png';
    const presetId = typeof body.presetId === 'string' ? body.presetId.trim() : undefined;

    if (!message && !imageBase64) {
      res.status(400).json({ error: 'Please provide message text or an image' });
      return;
    }

    const heuristics = body.heuristicReport ?? runHeuristicScan(message);
    const matchedKey = presetId && PRESET_FALLBACKS[presetId]
      ? presetId
      : message.includes('sbi-kyc-update')
        ? 'bank-kyc'
        : message.includes('indiapost-redeliver')
          ? 'delivery-courier'
          : message.includes('pm-kisan')
            ? 'govt-pmkisan'
            : message.includes('SWIGGY')
              ? 'genuine-bank'
              : undefined;

    const clientKey = typeof body.apiKey === 'string' && body.apiKey.trim().length > 0
      ? body.apiKey.trim()
      : typeof req.headers?.['x-gemini-api-key'] === 'string'
        ? req.headers['x-gemini-api-key'].trim()
        : '';

    const apiKey = (process.env.GEMINI_API_KEY || clientKey).trim();

    if (!apiKey) {
      if (matchedKey && PRESET_FALLBACKS[matchedKey]) {
        res.status(200).json({
          result: PRESET_FALLBACKS[matchedKey],
          heuristics,
          source: 'fallback_preset',
          notice: 'Loaded sample intelligence (API key not configured).',
        });
        return;
      }
      res.status(200).json({
        result: {
          risk_score: heuristics.heuristicScore,
          verdict: heuristics.heuristicScore >= 70 ? 'High Risk Scam' : heuristics.heuristicScore >= 30 ? 'Suspicious' : 'Safe',
          impersonated_entity: 'Other',
          extracted_text: message,
          highlighted_phrases: heuristics.flags.map((f) => f.label),
          phrase_annotations: heuristics.flags.map((f) => ({ phrase: f.label, reason: f.detail })),
          risk_explanation: 'Heuristic security pre-scan evaluated this message.',
          tactics_used: heuristics.flags.map((f) => f.label),
          safe_next_steps: ['Do not tap unverified links.', 'Report cyber fraud at 1930.'],
        },
        heuristics,
        source: 'heuristic_fallback',
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const promptParts = [
      'Analyze the following input for phishing or scam risk in Indian context.',
      message ? `Message text:\n"""\n${message}\n"""` : '',
      imageBase64 ? 'An image is attached.' : '',
    ].filter(Boolean);

    const contents = imageBase64
      ? {
          parts: [
            { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
            { text: promptParts.join('\n\n') },
          ],
        }
      : promptParts.join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.status(200).json({
      result: parsed,
      heuristics,
      source: 'gemini',
      modelUsed: 'gemini-2.5-flash',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Analysis error' });
  }
}
