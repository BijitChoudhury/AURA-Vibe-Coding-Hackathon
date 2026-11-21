import React, { useEffect, useState } from 'react';
import type { Verdict } from '../types/scamshield.ts';

interface RiskGaugeProps {
  score: number;
  verdict: Verdict;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, verdict }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Dynamic radiant palette based on risk level
  const getColor = (s: number) => {
    if (s <= 30) {
      return {
        main: '#10B981',
        bgDark: 'rgba(16,185,129,0.12)',
        bgLight: 'rgba(16,185,129,0.10)',
      };
    }
    if (s <= 60) {
      return {
        main: '#F59E0B',
        bgDark: 'rgba(245,158,11,0.12)',
        bgLight: 'rgba(245,158,11,0.10)',
      };
    }
    return {
      main: '#EF4444',
      bgDark: 'rgba(239,68,68,0.12)',
      bgLight: 'rgba(239,68,68,0.10)',
    };
  };

  const color = getColor(score);

  useEffect(() => {
    setAnimatedScore(0);
    const duration = 1200;
    const startTime = performance.now();

    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="glass p-6 sm:p-7 flex flex-col items-center justify-center animate-fade-in-up h-full relative overflow-hidden">
      {/* Light radiant ambient aura at the top of the card */}
      <div
        className="absolute -top-14 left-1/2 -translate-x-1/2 w-52 h-24 rounded-full blur-3xl pointer-events-none transition-colors duration-1000"
        style={{
          background: `${color.main}14`,
        }}
      />

      <h3 className="text-stone-500 dark:text-[oklch(70.9%_0.01_56.259)]/60 text-[11px] font-medium uppercase tracking-wider mb-4 relative z-10 transition-colors">
        Threat Assessment Score
      </h3>

      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Very light radiant glow behind the circular dial */}
        <div
          className="absolute -inset-2 rounded-full blur-2xl pointer-events-none transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${color.main}24 0%, ${color.main}06 55%, transparent 75%)`,
          }}
        />

        <svg
          width="176"
          height="176"
          viewBox="0 0 176 176"
          className="transform -rotate-90 relative z-10"
        >
          {/* Neutral background track - borderless track */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            className="stroke-[#e7e2d6] dark:stroke-[#17171b] transition-colors"
            strokeWidth="9"
          />
          {/* Score arc with light radiant drop-shadow */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke={color.main}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-circle"
            style={{
              filter: `drop-shadow(0 0 12px ${color.main}45)`,
            }}
          />
        </svg>

        {/* Center text with soft radiant text shadow */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span
            className="text-4xl font-bold tabular-nums transition-colors duration-500 font-mono"
            style={{
              color: color.main,
              textShadow: `0 0 24px ${color.main}35`,
            }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-stone-400 dark:text-[oklch(70.9%_0.01_56.259)]/50 font-mono mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Verdict badge - borderless aesthetic pill with light radiant glow */}
      <div
        className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider relative z-10 transition-all duration-500 shadow-sm"
        style={{
          backgroundColor: color.bgLight,
          color: color.main,
        }}
      >
        {verdict}
      </div>
    </div>
  );
};

export default RiskGauge;
