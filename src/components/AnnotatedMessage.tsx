import React from 'react';
import { MessageSquareWarning } from 'lucide-react';

interface AnnotatedMessageProps {
  text: string;
  highlights: string[];
  imagePreview?: string | null;
  annotations?: Array<{ phrase: string; reason: string }>;
}

export const AnnotatedMessage: React.FC<AnnotatedMessageProps> = ({
  text,
  highlights = [],
  imagePreview,
  annotations = [],
}) => {
  if (!text && !imagePreview) return null;

  const segments = text ? buildSegments(text, highlights || [], annotations) : [];

  return (
    <div className="glass p-6 sm:p-7 animate-fade-in-up-delay-1 opacity-0 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <MessageSquareWarning className="w-4 h-4 text-stone-500 dark:text-neutral-400" />
          <h3 className="text-stone-500 dark:text-neutral-400 text-[11px] font-medium uppercase tracking-wider">
            Message Content & Flagged Syntax
          </h3>
        </div>

        {/* Annotated text - borderless inset */}
        {text && (
          <div className="text-sm leading-relaxed text-stone-800 dark:text-[oklch(80%_0.01_56.259)] font-mono bg-[#f1ede4] dark:bg-[#0a0a0d] rounded-xl p-4 shadow-inner whitespace-pre-wrap">
            {segments.map((seg, i) =>
              seg.highlighted ? (
                <span
                  key={i}
                  className="scam-highlight bg-rose-500/15 text-rose-800 dark:bg-red-500/20 dark:text-red-200 rounded px-1.5 py-0.5 font-medium"
                  data-tooltip={seg.tooltip || 'Manipulative phrase'}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </div>
        )}

        {/* Image preview (for screenshot uploads) - borderless */}
        {imagePreview && (
          <div className="mt-3.5 rounded-xl overflow-hidden bg-[#f1ede4] dark:bg-[#0a0a0d] p-2.5 shadow-inner">
            <img
              src={imagePreview}
              alt="Analyzed screenshot"
              className="max-h-52 mx-auto object-contain rounded-lg"
            />
          </div>
        )}
      </div>

      {highlights && highlights.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {highlights.map((phrase, i) => (
            <span
              key={i}
              className="text-[11px] bg-rose-500/10 text-rose-700 dark:bg-red-500/10 dark:text-red-300 rounded-md px-2.5 py-1 font-mono"
            >
              "{phrase}"
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface Segment {
  text: string;
  highlighted: boolean;
  tooltip?: string;
}

function buildSegments(
  text: string,
  phrases: string[],
  annotations: Array<{ phrase: string; reason: string }> = [],
): Segment[] {
  if (!phrases || phrases.length === 0) return [{ text, highlighted: false }];

  interface Position {
    start: number;
    end: number;
    tooltip: string;
  }

  const positions: Position[] = [];
  phrases.forEach((phrase) => {
    if (!phrase || !phrase.trim()) return;
    const lowerText = text.toLowerCase();
    const lowerPhrase = phrase.toLowerCase().trim();
    let startIdx = 0;

    const matchedAnnotation = annotations.find(
      (a) =>
        a.phrase.toLowerCase() === lowerPhrase ||
        lowerPhrase.includes(a.phrase.toLowerCase()),
    );
    const tooltip = matchedAnnotation?.reason || 'Deceptive scam pattern';

    while (startIdx < lowerText.length) {
      const idx = lowerText.indexOf(lowerPhrase, startIdx);
      if (idx === -1) break;
      positions.push({
        start: idx,
        end: idx + phrase.trim().length,
        tooltip,
      });
      startIdx = idx + 1;
    }
  });

  if (positions.length === 0) return [{ text, highlighted: false }];

  positions.sort((a, b) => a.start - b.start);
  const merged: Position[] = [positions[0]];
  for (let i = 1; i < positions.length; i++) {
    const last = merged[merged.length - 1];
    if (positions[i].start <= last.end) {
      last.end = Math.max(last.end, positions[i].end);
    } else {
      merged.push(positions[i]);
    }
  }

  const segs: Segment[] = [];
  let cursor = 0;

  merged.forEach((pos) => {
    if (pos.start > cursor) {
      segs.push({ text: text.slice(cursor, pos.start), highlighted: false });
    }
    segs.push({
      text: text.slice(pos.start, pos.end),
      highlighted: true,
      tooltip: pos.tooltip,
    });
    cursor = pos.end;
  });

  if (cursor < text.length) {
    segs.push({ text: text.slice(cursor), highlighted: false });
  }

  return segs;
}

export default AnnotatedMessage;
