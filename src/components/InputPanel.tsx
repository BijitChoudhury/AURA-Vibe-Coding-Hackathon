import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-react';

export interface ImageDataPayload {
  base64: string;
  mimeType: string;
  name: string;
  preview: string;
}

interface InputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  imageData: ImageDataPayload | null;
  setImageData: (data: ImageDataPayload | null) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputText,
  setInputText,
  imageData,
  setImageData,
  onAnalyze,
  isAnalyzing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      setImageData({
        base64,
        mimeType: file.type,
        name: file.name,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processImage(file);
  };

  const canAnalyze = (inputText.trim().length > 0 || imageData) && !isAnalyzing;

  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      {/* Borderless aesthetic panel with soft inset surfaces */}
      <div className="glass p-6 sm:p-7 relative overflow-hidden">
        {/* Scanning shimmer when analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 scanning-shimmer pointer-events-none z-10" />
        )}

        {/* Text input area */}
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-neutral-400">
            Paste Message or Link
          </label>
          <span className="text-[10px] text-stone-400 dark:text-neutral-500 font-mono">
            SMS · WhatsApp · URLs
          </span>
        </div>

        {/* Recessed seamless input - borderless */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste suspicious SMS, WhatsApp message, or URL here..."
          rows={4}
          disabled={isAnalyzing}
          className="w-full bg-[#f1ede4] hover:bg-[#ece7dc] focus:bg-[#ece7dc] dark:bg-[#0a0a0d] dark:hover:bg-[#0c0c10] dark:focus:bg-[#0c0c10] rounded-xl px-4 py-3 text-stone-900 dark:text-[oklch(88%_0.01_56.259)] placeholder-stone-400 dark:placeholder-neutral-600 text-sm leading-relaxed resize-none outline-none transition-colors disabled:opacity-50 shadow-inner"
        />

        {/* Subtle spacing without harsh divider lines */}
        <div className="flex items-center justify-center my-3">
          <span className="text-[10px] text-stone-400 dark:text-neutral-600 uppercase tracking-widest font-mono">
            or
          </span>
        </div>

        {/* Image drop zone - borderless soft recessed surface */}
        {imageData ? (
          <div className="relative rounded-xl overflow-hidden bg-[#f1ede4] dark:bg-[#0a0a0d] p-3 shadow-inner">
            <img
              src={imageData.preview}
              alt="Uploaded screenshot"
              className="max-h-48 mx-auto object-contain rounded-lg"
            />
            <button
              onClick={() => setImageData(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-stone-300/80 hover:bg-stone-300 dark:bg-neutral-900/90 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors shadow-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-stone-700 dark:text-neutral-200" />
            </button>
            <div className="text-center pt-2 text-xs text-stone-500 dark:text-neutral-400 font-mono">
              {imageData.name}
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'bg-[#e7e1d5] dark:bg-[#15151b] scale-[0.995]'
                : 'bg-[#f1ede4] hover:bg-[#ece7dc] dark:bg-[#0a0a0d] dark:hover:bg-[#0e0e12]'
            }`}
          >
            <div className="flex flex-col items-center gap-1.5">
              {isDragging ? (
                <Upload className="w-5 h-5 text-stone-800 dark:text-neutral-200 animate-bounce" />
              ) : (
                <ImageIcon className="w-5 h-5 text-stone-400 dark:text-neutral-500" />
              )}
              <p className="text-xs text-stone-600 dark:text-neutral-400">
                {isDragging ? (
                  <span className="text-stone-900 dark:text-neutral-200 font-medium">
                    Release to inspect
                  </span>
                ) : (
                  <>
                    Drop a screenshot, or{' '}
                    <span className="text-stone-800 dark:text-neutral-200 hover:underline transition-colors">
                      browse files
                    </span>
                  </>
                )}
              </p>
              <p className="text-[10px] text-stone-400 dark:text-neutral-600 font-mono">
                PNG, JPG, WEBP
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => processImage(e.target.files?.[0])}
            />
          </div>
        )}

        {/* Low-saturation Analyze button that softly blends into the card */}
        <button
          onClick={() => onAnalyze()}
          disabled={!canAnalyze}
          className={`mt-4 w-full py-3 rounded-xl font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            canAnalyze
              ? 'bg-[#e8e2d6] hover:bg-[#dfd7c9] text-stone-700 dark:bg-[#18181f] dark:hover:bg-[#202028] dark:text-neutral-300 shadow-sm active:scale-[0.99]'
              : 'bg-[#f0ebe2]/60 text-stone-400 dark:bg-[#111114]/60 dark:text-neutral-600 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600 dark:text-neutral-400" />
              Evaluating Threat Vector…
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              Scan for Scam
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
