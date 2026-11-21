import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clipboard,
  FileImage,
  Globe,
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Shield,
  Trash2,
  UploadCloud,
  Zap,
} from 'lucide-react';
import type { HeuristicReport, InputMode } from '../types/scamshield.ts';

interface DualInputScannerProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  messageText: string;
  setMessageText: (text: string) => void;
  selectedImageBase64: string | null;
  selectedImageMime: string | null;
  selectedImageName: string | null;
  onImageSelected: (base64: string, mime: string, name: string) => void;
  onImageCleared: () => void;
  heuristicReport: HeuristicReport | null;
  onScan: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export const DualInputScanner: React.FC<DualInputScannerProps> = ({
  inputMode,
  setInputMode,
  messageText,
  setMessageText,
  selectedImageBase64,
  selectedImageMime,
  selectedImageName,
  onImageSelected,
  onImageCleared,
  heuristicReport,
  onScan,
  onClear,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      if (base64Data) {
        onImageSelected(base64Data, file.type, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMessageText(text);
      }
    } catch {
      // ignore
    }
  };

  const hasContent =
    inputMode === 'text'
      ? messageText.trim().length > 0
      : Boolean(selectedImageBase64);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl p-5 sm:p-6 transition-all">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 flex-wrap gap-2">
        <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'text'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-sky-400" />
            <span>Paste Message / URL</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'image'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Screenshot Image</span>
          </button>
        </div>

        {/* Quick Clear / Paste helpers */}
        <div className="flex items-center gap-2 text-xs">
          {inputMode === 'text' && (
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>
          )}

          {hasContent && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      {inputMode === 'text' ? (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste an SMS alert, WhatsApp forward, bank warning, or suspicious URL here (e.g. 'URGENT: Your account will be blocked...')"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 resize-y min-h-[110px] font-sans leading-relaxed transition-all"
            />
            {messageText.length > 0 && (
              <div className="absolute bottom-2.5 right-3 text-[11px] text-slate-500 font-mono">
                {messageText.length} characters
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!selectedImageBase64 ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragOver
                  ? 'border-sky-400 bg-sky-950/20'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-sky-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                Drop your WhatsApp or SMS screenshot here
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports PNG, JPEG, and WebP. Gemini Vision will transcribe the message and inspect sender details & URLs.
              </p>
              <button
                type="button"
                className="mt-3.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={`data:${selectedImageMime || 'image/png'};base64,${selectedImageBase64}`}
                  alt="Screenshot Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 truncate">
                    <FileImage className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{selectedImageName || 'Screenshot image'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Screenshot loaded ready for Gemini OCR transcription & multimodal fraud analysis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onImageCleared}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Heuristic Instant Findings Banner */}
      {inputMode === 'text' && messageText.trim().length > 0 && heuristicReport && (
        <div className="mt-3.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast JavaScript Heuristics</span>
              <span className="text-slate-500 font-mono">
                ({heuristicReport.scanDurationMs}ms)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">
                Pre-scan Threat:{' '}
                <strong
                  className={`font-semibold ${
                    heuristicReport.heuristicScore >= 50
                      ? 'text-red-400'
                      : heuristicReport.heuristicScore >= 20
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {heuristicReport.heuristicScore}/100
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {heuristicReport.urls.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono text-[11px]">
                <Globe className="w-3 h-3" />
                {heuristicReport.urls.length} URL
                {heuristicReport.urls.length === 1 ? '' : 's'} found
              </span>
            )}

            {heuristicReport.flags.length > 0 ? (
              heuristicReport.flags.map((flag) => (
                <span
                  key={flag.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${
                    flag.severity === 'high'
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{flag.label}</span>
                </span>
              ))
            ) : (
              <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                <span>✓ No immediate regex red flags detected</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Hybrid Architecture: Client Heuristic Regex + Gemini 3.5 Flash Lite</span>
        </div>

        <button
          type="button"
          onClick={onScan}
          disabled={!hasContent || isLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg cursor-pointer ${
            hasContent && !isLoading
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/20 hover:shadow-sky-500/30 scale-[1.01]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Risk...</span>
            </>
          ) : (
            <>
              <span>Scan with ScamShield</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
