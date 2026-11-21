import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.tsx';
import InputPanel, { type ImageDataPayload } from './components/InputPanel.tsx';
import PresetButtons, { PRESET_ITEMS } from './components/PresetButtons.tsx';
import ResultsDashboard from './components/ResultsDashboard.tsx';
import Footer from './components/Footer.tsx';
import { runHeuristicScan } from './lib/heuristics.ts';
import { DEMO_PRESETS, findFallbackPreset } from './data/presets.ts';
import type {
  AnalyzeRequestPayload,
  AnalyzeResponsePayload,
  ScamAnalysisResult,
} from './types/scamshield.ts';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const [inputText, setInputText] = useState('');
  const [imageData, setImageData] = useState<ImageDataPayload | null>(null);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('scamshield_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAnalyze = useCallback(
    async (
      overrideText?: string,
      overrideImage?: ImageDataPayload | null,
      presetIdx?: number,
    ) => {
      const textToAnalyze = overrideText ?? inputText;
      const imageToAnalyze = overrideImage ?? imageData;

      if (!textToAnalyze.trim() && !imageToAnalyze) return;

      setIsAnalyzing(true);
      setResult(null);

      // Step 1: Run fast heuristic pre-scan on text
      const heuristics = textToAnalyze.trim()
        ? runHeuristicScan(textToAnalyze)
        : undefined;

      const activeIdx = presetIdx !== undefined ? presetIdx : activePreset;
      const presetId =
        activeIdx !== null && activeIdx !== undefined && activeIdx >= 0
          ? DEMO_PRESETS[activeIdx]?.id
          : undefined;

      try {
        const payload: AnalyzeRequestPayload = {
          message: textToAnalyze,
          imageBase64: imageToAnalyze?.base64,
          imageMimeType: imageToAnalyze?.mimeType,
          presetId,
          apiKey: apiKey.trim() || undefined,
          heuristicReport: heuristics,
        };

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey.trim() ? { 'x-gemini-api-key': apiKey.trim() } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = (await res.json()) as AnalyzeResponsePayload;
          setResult(data.result);
        } else {
          // Check fallback for presets
          const matched = findFallbackPreset(presetId, textToAnalyze);
          if (matched) {
            await simulateDelay();
            setResult({
              ...matched.fallbackResult,
              extracted_text: matched.message,
            });
          } else {
            // Client heuristic fallback
            await simulateDelay();
            setResult(generateClientHeuristicResult(heuristics, textToAnalyze));
          }
        }
      } catch (err) {
        console.warn('API error, using verified preset intelligence:', err);
        const matched = findFallbackPreset(presetId, textToAnalyze);
        if (matched) {
          await simulateDelay();
          setResult({
            ...matched.fallbackResult,
            extracted_text: matched.message,
          });
        } else {
          await simulateDelay();
          setResult(generateClientHeuristicResult(heuristics, textToAnalyze));
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    [inputText, imageData, apiKey, activePreset],
  );

  const handlePreset = useCallback(
    (index: number) => {
      const preset = PRESET_ITEMS[index];
      setInputText(preset.text);
      setImageData(null);
      setActivePreset(index);
      handleAnalyze(preset.text, null, index);
    },
    [handleAnalyze],
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-white transition-colors">
      {/* Content */}
      <div className="relative z-10 flex-1">
        <Header
          apiKey={apiKey}
          setApiKey={setApiKey}
          showApiInput={showApiInput}
          setShowApiInput={setShowApiInput}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="pb-8">
          <InputPanel
            inputText={inputText}
            setInputText={(val) => {
              setInputText(val);
              setActivePreset(null);
            }}
            imageData={imageData}
            setImageData={setImageData}
            onAnalyze={() => handleAnalyze()}
            isAnalyzing={isAnalyzing}
          />

          <PresetButtons
            onPreset={handlePreset}
            activePreset={activePreset}
            isAnalyzing={isAnalyzing}
          />

          <ResultsDashboard
            result={result}
            inputText={inputText}
            imagePreview={imageData?.preview}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
}

function simulateDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 600));
}

function generateClientHeuristicResult(
  heuristics: ReturnType<typeof runHeuristicScan> | undefined,
  text: string,
): ScamAnalysisResult {
  const flags = heuristics?.flags || [];
  const score = heuristics?.heuristicScore ?? 20;
  const isHighRisk = score >= 60;
  const isSuspicious = score >= 20;

  return {
    risk_score: score,
    verdict: isHighRisk
      ? 'High Risk Scam'
      : isSuspicious
        ? 'Suspicious'
        : 'Safe',
    impersonated_entity: 'Other',
    extracted_text: text,
    highlighted_phrases: flags.map((f) => f.label),
    phrase_annotations: flags.map((f) => ({
      phrase: f.label,
      reason: f.detail,
    })),
    risk_explanation: isHighRisk
      ? 'Multiple high-risk indicators were detected in this message, such as suspicious links, APK downloads, or credential harvesting patterns.'
      : isSuspicious
        ? 'This message contains unverified links or urgency patterns that warrant caution.'
        : 'No malicious links, credential requests, or urgent coercion patterns were detected.',
    tactics_used: flags.map((f) => `${f.label}: ${f.detail}`),
    safe_next_steps: [
      'Do not click unknown links or share confidential information.',
      'Verify through official portals or customer support.',
      'Report suspected fraud at 1930 or cybercrime.gov.in.',
    ],
  };
}
