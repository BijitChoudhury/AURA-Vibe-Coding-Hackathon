import React from 'react';
import { ExternalLink, Link2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { runHeuristicScan } from '../lib/heuristics.ts';

interface LinkSafetyPillProps {
  text: string;
}

export const LinkSafetyPill: React.FC<LinkSafetyPillProps> = ({ text }) => {
  if (!text) return null;

  const heuristics = runHeuristicScan(text);
  if (heuristics.urls.length === 0) return null;

  return (
    <div className="animate-fade-in-up-delay-2 opacity-0">
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <Link2 className="w-4 h-4 text-stone-500 dark:text-neutral-400" />
        <h3 className="text-stone-500 dark:text-neutral-400 text-[11px] font-medium uppercase tracking-wider">
          Link Safety Inspection
        </h3>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {heuristics.urls.map((urlItem, i) => {
          const isSafe = urlItem.passed;

          return (
            <div
              key={i}
              className="bg-[#f1ede4] dark:bg-[#121215] rounded-xl p-3.5 flex items-start gap-3 max-w-full shadow-sm"
            >
              <div className="mt-0.5">
                {isSafe ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-red-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-stone-400 dark:text-neutral-500 flex-shrink-0" />
                  <p className="text-xs text-stone-800 dark:text-[oklch(85%_0.01_56.259)] font-mono truncate">
                    {urlItem.raw}
                  </p>
                </div>
                {isSafe ? (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
                    ✓ Clean link pattern
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {urlItem.reasons.map((reason, j) => (
                      <span
                        key={j}
                        className="text-[10px] bg-rose-500/10 text-rose-700 dark:bg-red-500/10 dark:text-red-300 rounded px-2 py-0.5 font-medium"
                      >
                        ✕ {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LinkSafetyPill;
