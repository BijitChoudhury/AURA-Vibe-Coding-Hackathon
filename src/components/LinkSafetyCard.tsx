import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { HeuristicUrlCheck } from '../types/scamshield.ts';

interface LinkSafetyCardProps {
  urls: HeuristicUrlCheck[];
}

export const LinkSafetyCard: React.FC<LinkSafetyCardProps> = ({ urls = [] }) => {
  if (urls.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Link Safety Status: No Outbound Links Detected
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              The inspected message contains no clickable hyperlinks, external domains, or shortened redirect URLs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allPassed = urls.every((u) => u.passed);
  const dangerousCount = urls.filter((u) => u.status === 'dangerous').length;
  const suspiciousCount = urls.filter((u) => u.status === 'suspicious').length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
      {/* Top Banner / Pill Summary */}
      <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link2 className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-slate-200">
            Extracted Links & Domain Heuristics
          </span>
          <span className="text-xs text-slate-400">
            ({urls.length} link{urls.length === 1 ? '' : 's'} audited)
          </span>
        </div>

        {/* Status Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            dangerousCount > 0
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : suspiciousCount > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {dangerousCount > 0 ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>{dangerousCount} Malicious Link Flagged</span>
            </>
          ) : suspiciousCount > 0 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Suspicious Link Structure</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All Links Passed Heuristics</span>
            </>
          )}
        </div>
      </div>

      {/* URL Items list */}
      <div className="divide-y divide-slate-800/80">
        {urls.map((item, index) => {
          const isDanger = item.status === 'dangerous';
          const isSusp = item.status === 'suspicious';

          return (
            <div
              key={index}
              className={`p-4 transition-colors ${
                isDanger
                  ? 'bg-red-950/20 hover:bg-red-950/30'
                  : isSusp
                    ? 'bg-amber-950/15 hover:bg-amber-950/25'
                    : 'bg-transparent hover:bg-slate-800/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isDanger
                        ? 'bg-red-500/20 text-red-400'
                        : isSusp
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-slate-100 font-semibold break-all">
                        {item.raw}
                      </span>
                      {item.hostname && item.hostname !== item.raw && (
                        <span className="text-xs text-slate-400 font-mono">
                          [{item.hostname}]
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verdict pill */}
                <div className="shrink-0 self-start sm:self-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                      isDanger
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : isSusp
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isDanger
                      ? 'FAILED HEURISTIC'
                      : isSusp
                        ? 'SUSPICIOUS'
                        : 'PASSED'}
                  </span>
                </div>
              </div>

              {/* Reasons / Findings */}
              {item.reasons.length > 0 && (
                <div className="mt-2 pl-8.5">
                  <ul className="space-y-1 text-xs">
                    {item.reasons.map((reason, rIdx) => (
                      <li
                        key={rIdx}
                        className={`flex items-center gap-1.5 ${
                          isDanger
                            ? 'text-red-300'
                            : isSusp
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
