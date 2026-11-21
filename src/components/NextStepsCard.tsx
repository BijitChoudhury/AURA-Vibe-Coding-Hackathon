import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface NextStepsCardProps {
  steps?: string[];
}

export const NextStepsCard: React.FC<NextStepsCardProps> = ({ steps = [] }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="glass p-6 sm:p-7 animate-fade-in-up-delay-3 opacity-0 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3.5 px-0.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-stone-500 dark:text-neutral-400 text-[11px] font-medium uppercase tracking-wider">
            Recommended Action Plan
          </h3>
        </div>

        <ul className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-[#f1ede4] dark:bg-[#18181e] flex items-center justify-center">
                  <span className="text-[11px] font-medium text-stone-700 dark:text-neutral-300 font-mono">
                    {i + 1}
                  </span>
                </div>
              </div>
              <p className="text-sm text-stone-700 dark:text-[oklch(75%_0.01_56.259)] leading-relaxed">
                {linkify(step)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick action buttons - borderless aesthetic pills */}
      <div className="mt-5 pt-2 flex flex-wrap gap-2">
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs bg-[#eee8dd] hover:bg-[#e4ddd2] text-emerald-700 dark:bg-[#17171d] dark:hover:bg-[#1e1e26] dark:text-emerald-400 rounded-lg px-3.5 py-2 font-medium transition-colors"
        >
          Report at cybercrime.gov.in
          <ArrowRight className="w-3 h-3" />
        </a>
        <a
          href="tel:1930"
          className="inline-flex items-center gap-1.5 text-xs bg-[#eee8dd] hover:bg-[#e4ddd2] text-stone-800 dark:bg-[#17171d] dark:hover:bg-[#1e1e26] dark:text-white rounded-lg px-3.5 py-2 font-medium transition-colors"
        >
          📞 Call Helpline 1930
        </a>
      </div>
    </div>
  );
};

/** Turn URLs in text into clickable links */
function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s,]+)/g;
  const parts = text.split(urlRegex);

  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-300 break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default NextStepsCard;
