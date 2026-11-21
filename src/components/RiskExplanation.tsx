import React from 'react';
import { AlertTriangle, Eye, User } from 'lucide-react';
import type { ImpersonatedEntity } from '../types/scamshield.ts';

interface RiskExplanationProps {
  explanation?: string;
  tactics?: string[];
  entity?: ImpersonatedEntity | string;
}

export const RiskExplanation: React.FC<RiskExplanationProps> = ({
  explanation,
  tactics = [],
  entity,
}) => {
  if (!explanation) return null;

  const entityColors: Record<string, { bg: string; text: string }> = {
    Bank: {
      bg: 'bg-rose-500/10 dark:bg-red-500/10',
      text: 'text-rose-700 dark:text-red-300',
    },
    'Delivery Service': {
      bg: 'bg-amber-500/15 dark:bg-amber-500/10',
      text: 'text-amber-800 dark:text-amber-300',
    },
    Government: {
      bg: 'bg-purple-500/15 dark:bg-purple-500/10',
      text: 'text-purple-800 dark:text-purple-300',
    },
    'Government Organisation': {
      bg: 'bg-purple-500/15 dark:bg-purple-500/10',
      text: 'text-purple-800 dark:text-purple-300',
    },
    Other: {
      bg: 'bg-stone-200/80 dark:bg-neutral-800',
      text: 'text-stone-700 dark:text-neutral-300',
    },
    None: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
  };

  const eColors = (entity && entityColors[entity]) || entityColors.Other;

  return (
    <div className="glass p-6 sm:p-7 animate-fade-in-up-delay-2 opacity-0 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <Eye className="w-4 h-4 text-stone-500 dark:text-neutral-400" />
          <h3 className="text-stone-500 dark:text-neutral-400 text-[11px] font-medium uppercase tracking-wider">
            Risk Analysis
          </h3>
        </div>

        {/* Impersonated Entity Badge - borderless */}
        {entity && entity !== 'None' && (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1 mb-3.5 ${eColors.bg} ${eColors.text}`}
          >
            <User className="w-3.5 h-3.5" />
            Impersonation: {entity}
          </div>
        )}

        {/* Explanation */}
        <p className="text-sm text-stone-700 dark:text-[oklch(75%_0.01_56.259)] leading-relaxed mb-4">
          {explanation}
        </p>
      </div>

      {/* Tactics */}
      {tactics && tactics.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1.5 mb-2 px-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider">
              Identified Tactics
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tactics.map((tactic, i) => (
              <span
                key={i}
                className="text-xs bg-amber-500/15 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200 rounded-md px-2.5 py-1 font-normal"
              >
                {tactic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskExplanation;
