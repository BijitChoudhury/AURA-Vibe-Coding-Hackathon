import React from 'react';
import { Moon, Shield, Sun } from 'lucide-react';

interface HeaderProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  showApiInput: boolean;
  setShowApiInput: React.Dispatch<React.SetStateAction<boolean>>;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  setApiKey,
  showApiInput,
  setShowApiInput,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="relative z-10">
      <div className="relative max-w-5xl mx-auto px-4 py-5 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eee8dd] dark:bg-[#151518] flex items-center justify-center shadow-sm transition-colors">
              <Shield
                className="w-4 h-4 text-stone-700 dark:text-neutral-200"
                strokeWidth={2.2}
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-medium tracking-tight text-stone-900 dark:text-white leading-none transition-colors">
                ScamShield
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-neutral-400 font-normal mt-1 transition-colors">
                Indian Digital Fraud & Scam Detection Engine
              </p>
            </div>
          </div>

          {/* Action pills: Theme toggle + API key toggle */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-[#eee8dd] hover:bg-[#e4ddd2] dark:bg-[#141417] dark:hover:bg-[#1a1a20] text-stone-700 dark:text-neutral-400 dark:hover:text-white shadow-sm cursor-pointer"
              title={
                theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
              }
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" />
              )}
            </button>

            {/* API key toggle */}
            <button
              onClick={() => setShowApiInput((v) => !v)}
              className="rounded-full px-3.5 py-1.5 text-xs text-stone-700 hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white bg-[#eee8dd] hover:bg-[#e4ddd2] dark:bg-[#141417] dark:hover:bg-[#1a1a20] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  apiKey
                    ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'bg-stone-400 dark:bg-neutral-600'
                }`}
              />
              {apiKey ? 'API Connected' : 'Add API Key'}
            </button>
          </div>
        </div>

        {/* Collapsible API key input */}
        {showApiInput && (
          <div className="mt-4 animate-fade-in-up">
            <div className="glass p-4 max-w-md">
              <label className="text-[11px] text-stone-600 dark:text-neutral-400 font-medium block mb-2">
                Gemini API Key{' '}
                <span className="text-stone-400 dark:text-neutral-500 font-normal">
                  (optional — samples work offline)
                </span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#f1ede4] dark:bg-[#0a0a0c] rounded-lg px-3.5 py-2 text-xs text-stone-900 dark:text-neutral-200 placeholder-stone-400 dark:placeholder-neutral-600 focus:bg-[#e8e2d6] dark:focus:bg-[#0e0e12] outline-none transition-colors"
              />
              <p className="text-[10px] text-stone-500 dark:text-neutral-500 mt-2">
                Free key at{' '}
                <span className="text-stone-700 dark:text-neutral-400 underline">
                  aistudio.google.com/apikey
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
