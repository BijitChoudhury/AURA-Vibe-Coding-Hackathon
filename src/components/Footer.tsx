import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="max-w-5xl mx-auto px-4 py-8 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-neutral-500">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500/80" />
          <span>
            Report digital fraud at{' '}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-700 hover:text-stone-900 dark:text-neutral-300 dark:hover:text-white transition-colors underline underline-offset-4"
            >
              cybercrime.gov.in
            </a>{' '}
            or call toll-free{' '}
            <a
              href="tel:1930"
              className="text-stone-700 hover:text-stone-900 dark:text-neutral-300 dark:hover:text-white transition-colors font-mono"
            >
              1930
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
