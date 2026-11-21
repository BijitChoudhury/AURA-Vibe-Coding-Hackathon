import React from 'react';
import RiskGauge from './RiskGauge.tsx';
import AnnotatedMessage from './AnnotatedMessage.tsx';
import LinkSafetyPill from './LinkSafetyPill.tsx';
import RiskExplanation from './RiskExplanation.tsx';
import NextStepsCard from './NextStepsCard.tsx';
import type { ScamAnalysisResult } from '../types/scamshield.ts';

interface ResultsDashboardProps {
  result: ScamAnalysisResult | null;
  inputText: string;
  imagePreview?: string | null;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  inputText,
  imagePreview,
}) => {
  if (!result) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8">
      {/* Section header - borderless typographic spacing */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.25em]">
          Analysis Results
        </h2>
        <span className="text-[10px] text-neutral-600 font-mono">
          Realtime Evaluation
        </span>
      </div>

      {/* Top row: Gauge + Annotated Message */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 mb-3.5 items-stretch">
        <div className="lg:col-span-2">
          <RiskGauge score={result.risk_score} verdict={result.verdict} />
        </div>
        <div className="lg:col-span-3">
          <AnnotatedMessage
            text={result.extracted_text || inputText}
            highlights={result.highlighted_phrases}
            imagePreview={imagePreview}
            annotations={result.phrase_annotations}
          />
        </div>
      </div>

      {/* Link safety pills */}
      <div className="mb-3.5">
        <LinkSafetyPill text={result.extracted_text || inputText} />
      </div>

      {/* Bottom row: Risk Explanation + Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-10 items-stretch">
        <RiskExplanation
          explanation={result.risk_explanation}
          tactics={result.tactics_used}
          entity={result.impersonated_entity}
        />
        <NextStepsCard steps={result.safe_next_steps} />
      </div>
    </div>
  );
};

export default ResultsDashboard;
