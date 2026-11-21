export type Verdict = 'Safe' | 'Suspicious' | 'High Risk Scam';

export type ImpersonatedEntity =
  | 'Bank'
  | 'Delivery Service'
  | 'Government'
  | 'Government Organisation'
  | 'Other'
  | 'None';

export type InputMode = 'text' | 'image';

export interface HeuristicUrlCheck {
  raw: string;
  normalized: string;
  hostname: string;
  passed: boolean;
  status: 'safe' | 'suspicious' | 'dangerous';
  reasons: string[];
}

export interface HeuristicFlag {
  id: string;
  category: 'link' | 'credential' | 'malware' | 'urgency' | 'lure';
  label: string;
  detail: string;
  severity: 'high' | 'medium';
}

export interface HeuristicReport {
  urls: HeuristicUrlCheck[];
  flags: HeuristicFlag[];
  heuristicScore: number;
  scanDurationMs: number;
}

export interface PhraseAnnotation {
  phrase: string;
  reason: string;
}

export interface ScamAnalysisResult {
  risk_score: number;
  verdict: Verdict;
  impersonated_entity: ImpersonatedEntity;
  highlighted_phrases: string[];
  phrase_annotations?: PhraseAnnotation[];
  risk_explanation: string;
  tactics_used: string[];
  safe_next_steps: string[];
  extracted_text?: string;
}

export interface DemoPreset {
  id: 'bank-kyc' | 'delivery-courier' | 'govt-pmkisan' | 'genuine-bank';
  title: string;
  shortDescription: string;
  channel: 'SMS' | 'WhatsApp';
  senderLabel: string;
  expectedRisk: 'High Risk' | 'Safe';
  message: string;
  fallbackResult: ScamAnalysisResult;
}

export interface AnalyzeRequestPayload {
  message?: string;
  imageBase64?: string;
  imageMimeType?: string;
  presetId?: string;
  apiKey?: string;
  heuristicReport?: HeuristicReport;
}

export interface AnalyzeResponsePayload {
  result: ScamAnalysisResult;
  heuristics: HeuristicReport;
  source: 'gemini' | 'fallback_preset';
  modelUsed?: string;
  notice?: string;
}
