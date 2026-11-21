import React from 'react';
import {
  Building2,
  CheckCircle2,
  FileCode2,
  Landmark,
  Package,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DEMO_PRESETS } from '../data/presets.ts';
import type { DemoPreset } from '../types/scamshield.ts';

interface PresetSelectorProps {
  activePresetId?: string;
  onSelectPreset: (preset: DemoPreset) => void;
  isLoading: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  activePresetId,
  onSelectPreset,
  isLoading,
}) => {
  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'bank-kyc':
        return <Landmark className="w-4 h-4 text-red-400" />;
      case 'delivery-courier':
        return <Package className="w-4 h-4 text-amber-400" />;
      case 'govt-pmkisan':
        return <Building2 className="w-4 h-4 text-red-400" />;
      case 'genuine-bank':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            One-Click Demo Presets
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Click any preset to test detection instantly
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEMO_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const isSafe = preset.expectedRisk === 'Safe';

          return (
            <button
              key={preset.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between ${
                isActive
                  ? isSafe
                    ? 'bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'bg-red-950/30 border-red-500/80 shadow-lg shadow-red-500/10 ring-1 ring-red-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    {getPresetIcon(preset.id)}
                    <span className="text-xs font-bold text-slate-100">
                      {preset.title}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide font-mono ${
                      isSafe
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                    }`}
                  >
                    {isSafe ? '0 False Pos' : 'Scam'}
                  </span>
                </div>

                {/* Subtitle & channel tag */}
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2.5">
                  {preset.shortDescription}
                </p>
              </div>

              {/* Sender & channel badge */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[120px] text-slate-300">
                  {preset.senderLabel}
                </span>
                <span className="text-slate-400 font-semibold">{preset.channel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
