import type {
  HeuristicFlag,
  HeuristicReport,
  HeuristicUrlCheck,
} from '../types/scamshield.ts';

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'rb.gy',
  'cutt.ly',
  'is.gd',
  'shorturl.at',
  'ow.ly',
  'tiny.cc',
  'rebrand.ly',
  'bitly.com',
  'short.link',
  's.id',
]);

const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.click',
  '.loan',
  '.buzz',
  '.gq',
  '.tk',
  '.ml',
  '.cf',
  '.work',
  '.icu',
  '.vip',
  '.cc',
  '.site',
  '.online',
  '.club',
  '.rest',
  '.cam',
];

const OFFICIAL_TRUSTED_DOMAINS = [
  'onlinesbi.sbi',
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'indiapost.gov.in',
  'incometax.gov.in',
  'pmkisan.gov.in',
  'cybercrime.gov.in',
  'rbi.org.in',
  'uidai.gov.in',
  'npci.org.in',
];

const IMPERSONATION_KEYWORDS = [
  'sbi',
  'yono',
  'hdfc',
  'icici',
  'axis',
  'kotak',
  'kyc',
  'indiapost',
  'indpost',
  'pmkisan',
  'incometax',
  'taxrefund',
  'aadhaar',
  'panverify',
  'npci',
  'rbi',
];

const URL_REGEX =
  /(?:https?:\/\/[^\s<>"')]+|(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|in|org|net|gov\.in|co\.in|ly|xyz|top|click|loan|buzz|gq|tk|ml|cf|work|icu|vip|cc|site|online|club|me|io|co|at|gd|gy)(?:\/[^\s<>"')]*)?)/gi;

const APK_FILE_REGEX = /\b[\w-]+\.apk\b/gi;

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
  let dangerous = false;
  let suspicious = false;

  let hostname = '';
  let pathname = '';

  try {
    const parsed = new URL(normalized);
    hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    pathname = parsed.pathname.toLowerCase();
  } catch {
    hostname = raw.split('/')[0].toLowerCase();
    pathname = raw.toLowerCase();
  }

  if (/^http:\/\//i.test(raw)) {
    reasons.push('Unencrypted HTTP link (not HTTPS)');
    suspicious = true;
  }

  if (URL_SHORTENERS.has(hostname)) {
    reasons.push(`Shortened URL (${hostname}) hides true destination`);
    dangerous = true;
  }

  const matchedTld = SUSPICIOUS_TLDS.find((tld) => hostname.endsWith(tld));
  if (matchedTld) {
    reasons.push(`High-risk domain extension (${matchedTld})`);
    dangerous = true;
  }

  if (/\.apk(\?|$)/i.test(pathname) || /\.apk$/i.test(raw)) {
    reasons.push('Direct Android APK download (high malware risk)');
    dangerous = true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    reasons.push('Uses raw IP address instead of a verified domain');
    dangerous = true;
  }

  if (raw.includes('@')) {
    reasons.push('Contains deceptive "@" redirect syntax');
    dangerous = true;
  }

  const trusted = isTrustedDomain(hostname);
  if (!trusted) {
    const impersonatedTerm = IMPERSONATION_KEYWORDS.find((kw) =>
      hostname.includes(kw),
    );
    if (impersonatedTerm) {
      reasons.push(
        `Unofficial lookalike domain referencing "${impersonatedTerm}"`,
      );
      dangerous = true;
    }
  }

  if (reasons.length === 0) {
    if (trusted) {
      reasons.push('Matches a verified official domain');
    } else {
      reasons.push('No heuristic URL anomalies detected');
    }
  }

  const status: HeuristicUrlCheck['status'] = dangerous
    ? 'dangerous'
    : suspicious
      ? 'suspicious'
      : 'safe';

  return {
    raw,
    normalized,
    hostname: hostname || raw,
    passed: status === 'safe',
    status,
    reasons,
  };
}

export function runHeuristicScan(text: string): HeuristicReport {
  const start =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      urls: [],
      flags: [],
      heuristicScore: 0,
      scanDurationMs: 0,
    };
  }

  const rawMatches = trimmed.match(URL_REGEX) ?? [];
  const seenUrls = new Set<string>();
  const urls: HeuristicUrlCheck[] = [];

  for (const match of rawMatches) {
    const cleaned = cleanMatchedUrl(match);
    // Avoid false positives like "Rs.25" or "A/c" or decimal numbers
    if (/^(rs|mr|mrs|dr|no|ref|st|v\d)\./i.test(cleaned)) {
      continue;
    }
    const key = cleaned.toLowerCase();
    if (!seenUrls.has(key)) {
      seenUrls.add(key);
      urls.push(evaluateUrl(cleaned));
    }
  }

  const flags: HeuristicFlag[] = [];
  let score = 0;

  // Check URL findings
  const hasHttp = urls.some((u) => /^http:\/\//i.test(u.raw));
  const hasShortener = urls.some((u) => URL_SHORTENERS.has(u.hostname));
  const hasSuspiciousTld = urls.some((u) =>
    SUSPICIOUS_TLDS.some((tld) => u.hostname.endsWith(tld)),
  );
  const hasApkUrl = urls.some((u) => /\.apk/i.test(u.raw));
  const hasApkMention = APK_FILE_REGEX.test(trimmed);
  const hasLookalike = urls.some((u) =>
    u.reasons.some((r) => r.startsWith('Unofficial lookalike')),
  );

  if (hasHttp) {
    score += 20;
    flags.push({
      id: 'http-link',
      category: 'link',
      label: 'Unencrypted HTTP Link',
      detail: 'Legitimate banks and government portals require HTTPS encryption.',
      severity: 'medium',
    });
  }

  if (hasShortener) {
    score += 28;
    flags.push({
      id: 'url-shortener',
      category: 'link',
      label: 'URL Shortener Detected',
      detail: 'Shortened links disguise the actual destination website.',
      severity: 'high',
    });
  }

  if (hasSuspiciousTld) {
    score += 32;
    flags.push({
      id: 'suspicious-tld',
      category: 'link',
      label: 'Suspicious Domain Extension',
      detail: 'Domain uses a low-cost extension heavily abused in phishing campaigns.',
      severity: 'high',
    });
  }

  if (hasLookalike) {
    score += 35;
    flags.push({
      id: 'lookalike-domain',
      category: 'link',
      label: 'Lookalike Impersonation Domain',
      detail: 'Web address mimics an official bank, courier, or government name on an unofficial host.',
      severity: 'high',
    });
  }

  if (hasApkUrl || hasApkMention) {
    score += 45;
    flags.push({
      id: 'apk-file',
      category: 'malware',
      label: 'Android .APK File Detected',
      detail: 'Installing .apk files outside official app stores can silently forward your SMS OTPs to attackers.',
      severity: 'high',
    });
  }

  // Detect OTP/PIN/CVV solicitation while avoiding genuine bank disclaimers ("never asks for OTP, PIN, or CVV")
  const hasDisclaimer =
    /never\s+(?:asks?|requests?|calls?|shares?)\s+(?:you\s+)?(?:for\s+)?(?:your\s+)?(?:otp|pin|cvv|password)/i.test(
      trimmed,
    ) ||
    /do\s+not\s+share\s+(?:your\s+)?(?:otp|pin|cvv)/i.test(trimmed);

  const requestsSensitiveCreds =
    !hasDisclaimer &&
    /(?:confirm|enter|share|send|submit|verify|provide|update|type)\b[^.\n]{0,45}\b(?:otp|atm\s*pin|upi\s*pin|mpin|cvv|pin|password|aadhaar|pan\s*card|bank\s*details)/i.test(
      trimmed,
    );

  if (requestsSensitiveCreds) {
    score += 35;
    flags.push({
      id: 'credential-request',
      category: 'credential',
      label: 'OTP / PIN / Sensitive Data Request',
      detail: 'Asks for private credentials or banking details that genuine institutions never request via links.',
      severity: 'high',
    });
  }

  // Detect high-pressure urgency / account suspension threats
  const hasUrgency =
    /(?:permanently\s+blocked|account\s+(?:will\s+be\s+)?(?:blocked|suspended|frozen|deactivated)|within\s+\d+\s*(?:hours?|hrs?|mins?|minutes?)|update\s+immediately|avoid\s+suspension|last\s+warning|legal\s+action|address\s+(?:is\s+)?incomplete)/i.test(
      trimmed,
    );

  if (hasUrgency) {
    score += 22;
    flags.push({
      id: 'urgency-threat',
      category: 'urgency',
      label: 'Artificial Urgency / Threat',
      detail: 'Uses countdown pressure or threats of account closure or returned parcels to force hasty clicks.',
      severity: 'medium',
    });
  }

  // Detect financial refund / reward bait combined with action
  const hasRefundBait =
    /(?:refund\s+of\s+(?:rs\.?|inr|₹)|has\s+been\s+approved|instant\s+credit|redelivery\s+fee|claim\s+(?:now|your)|lottery|prize\s+money)/i.test(
      trimmed,
    );

  if (hasRefundBait) {
    score += 18;
    flags.push({
      id: 'financial-lure',
      category: 'lure',
      label: 'Financial Lure or Fee Trap',
      detail: 'Offers an unexpected refund or demands a small fee to capture your payment card or bank credentials.',
      severity: 'medium',
    });
  }

  const end =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    urls,
    flags,
    heuristicScore: Math.min(100, score),
    scanDurationMs: Math.max(0.1, Number((end - start).toFixed(1))),
  };
}
