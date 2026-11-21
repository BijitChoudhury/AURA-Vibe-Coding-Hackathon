import React from 'react';
import {
  Building2,
  ChevronRight,
  Landmark,
  Package,
  ShieldCheck,
} from 'lucide-react';

export interface PresetItem {
  id: string;
  label: string;
  icon: 'Building2' | 'Package' | 'Landmark' | 'ShieldCheck';
  description: string;
  text: string;
}

export const PRESET_ITEMS: PresetItem[] = [
  {
    id: 'fake-bank',
    label: 'Fake Bank KYC',
    icon: 'Building2',
    description: 'Urgent account-block threat with lookalike link',
    text: 'Dear Customer, Your SBI account will be blocked within 24 hours due to incomplete KYC verification. Update your KYC immediately to avoid service disruption: http://sbi-kyc-update.xyz/verify?ref=KYC2026 . Call 9876543210 for assistance. -SBI Team',
  },
  {
    id: 'fake-delivery',
    label: 'Fake Delivery SMS',
    icon: 'Package',
    description: 'India Post "address incomplete" with shortened link',
    text: 'India Post: Your package #IN4829371 cannot be delivered due to incomplete address information. Please update your delivery details within 24hrs: https://bit.ly/indiapost-redeliver to avoid return to sender. -India Post',
  },
  {
    id: 'fake-govt',
    label: 'Fake Govt Scheme',
    icon: 'Landmark',
    description: 'PM-Kisan refund with malicious .apk download',
    text: 'PM-Kisan Yojana: Congratulations! ₹6000 has been credited to your account under PM Kisan Samman Nidhi. Download the verification app to claim your payment: https://pm-kisan-verify.top/app.apk . Share this message with your family members! -Ministry of Agriculture',
  },
  {
    id: 'genuine-alert',
    label: 'Genuine Bank Alert',
    icon: 'ShieldCheck',
    description: 'Real SBI transaction alert (zero false positives)',
    text: 'SBI: INR 2,500.00 debited from A/c XX4821 on 21-11-2026. Info: UPI/SWIGGY. If not done by you, call 1800111109. Available bal: INR 15,432.50 -SBI',
  },
];

interface PresetButtonsProps {
  onPreset: (index: number) => void;
  activePreset: number | null;
  isAnalyzing: boolean;
}

export const PresetButtons: React.FC<PresetButtonsProps> = ({
  onPreset,
  activePreset,
  isAnalyzing,
}) => {
  const getIcon = (iconName: PresetItem['icon']) => {
    switch (iconName) {
      case 'Building2':
        return Building2;
      case 'Package':
        return Package;
      case 'Landmark':
        return Landmark;
      case 'ShieldCheck':
        return ShieldCheck;
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <p className="text-[11px] text-stone-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
          One-Click Samples
        </p>
        <span className="text-[10px] text-stone-400 dark:text-neutral-500 font-mono">
          Instant threat analysis
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PRESET_ITEMS.map((preset, index) => {
          const IconComp = getIcon(preset.icon);
          const isActive = activePreset === index;

          return (
            <button
              key={preset.id}
              onClick={() => onPreset(index)}
              disabled={isAnalyzing}
              className={`p-3.5 rounded-xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                isActive
                  ? 'bg-[#e4ddd0] dark:bg-[#1e1e24] shadow-sm'
                  : 'bg-[#f1ede4] hover:bg-[#ece6db] dark:bg-[#121215] dark:hover:bg-[#17171c]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <IconComp
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? 'text-stone-900 dark:text-neutral-200'
                        : 'text-stone-500 dark:text-neutral-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium truncate ${
                      isActive
                        ? 'text-stone-900 dark:text-white'
                        : 'text-stone-700 dark:text-neutral-200'
                    }`}
                  >
                    {preset.label}
                  </span>
                </div>
                <ChevronRight
                  className={`w-3 h-3 flex-shrink-0 ${
                    isActive
                      ? 'text-stone-700 dark:text-neutral-300'
                      : 'text-stone-400 dark:text-neutral-600'
                  }`}
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-neutral-400 leading-snug line-clamp-2">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetButtons;
