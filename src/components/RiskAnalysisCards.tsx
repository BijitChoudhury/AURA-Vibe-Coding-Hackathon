import React, { useState } from 'react';
import {
  AlertOctagon,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  ListChecks,
  PhoneCall,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import type { ScamAnalysisResult } from '../types/scamshield.ts';

interface RiskAnalysisCardsProps {
  result: ScamAnalysisResult;
}

export const RiskAnalysisCards: React.FC<RiskAnalysisCardsProps> = ({ result }) => {
  const [copiedSteps, setCopiedSteps] = useState(false);
  const isHighRisk = result.risk_score >= 70;
  const isSuspicious = result.risk_score >= 30 && result.risk_score < 70;
  const isSafe = result.risk_score < 30;

  const handleCopySteps = async () => {
    try {
      const text = [
        `ScamShield Safety Checklist for: ${result.verdict} (${result.risk_score}/100)`,
        '',
        ...result.safe_next_steps.map((step, idx) => `${idx + 1}. ${step}`),
        '',
        'Emergency Cyber Helpline (India): Dial 1930 or visit https://cybercrime.gov.in',
      ].join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedSteps(true);
      setTimeout(() => setCopiedSteps(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* CARD 1: Understand the Risk */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-3.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isHighRisk
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : isSuspicious
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isSafe ? (
                <Shield className="w-4 h-4" />
              ) : (
                <BrainCircuit className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Understand the Risk
              </h3>
              <p className="text-xs text-slate-400">
                Plain-language mechanics of what happens behind the scenes
              </p>
            </div>
          </div>

          {/* Plain Language Explanation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
            <p className="text-sm leading-relaxed text-slate-200">
              {result.risk_explanation}
            </p>
          </div>

          {/* Tactics Used */}
          {result.tactics_used && result.tactics_used.length > 0 ? (
            <div className="space-y-2 mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>Manipulation & Technical Tactics Identified</span>
              </h4>
              <div className="space-y-2">
                {result.tactics_used.map((tactic, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="leading-snug">{tactic}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Zero deceptive tactics or psychological manipulation detected in this message.
              </span>
            </div>
          )}
        </div>

        {/* Bottom trust footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>AI Threat Analysis Powered by Gemini 3.5</span>
          <span className="font-mono">Heuristic + LLM Correlation</span>
        </div>
      </div>

      {/* CARD 2: What To Do Next */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                <ListChecks className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  What To Do Next
                </h3>
                <p className="text-xs text-slate-400">
                  Actionable protection checklist & emergency reporting
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopySteps}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
              title="Copy checklist"
            >
              {copiedSteps ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy List</span>
                </>
              )}
            </button>
          </div>

          {/* Action Checklist */}
          <div className="space-y-2.5 mb-5">
            {result.safe_next_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 text-xs sm:text-sm text-slate-200"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* National Cybercrime Helpline 1930 / cybercrime.gov.in Callout */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 border border-red-500/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    National Cybercrime Helpline
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/40">
                    DIAL 1930
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Call 1930 immediately if you lost money or shared bank details
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:1930"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1 shadow-sm"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call 1930</span>
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer noopener"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <span>cybercrime.gov.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
