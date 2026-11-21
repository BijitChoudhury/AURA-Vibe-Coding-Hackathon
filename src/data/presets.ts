import type { DemoPreset, ScamAnalysisResult } from '../types/scamshield.ts';

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'bank-kyc',
    title: 'Fake Bank KYC',
    shortDescription: 'Urgent account-block threat with lookalike link',
    channel: 'SMS',
    senderLabel: 'SBI Team',
    expectedRisk: 'High Risk',
    message:
      'Dear Customer, Your SBI account will be blocked within 24 hours due to incomplete KYC verification. Update your KYC immediately to avoid service disruption: http://sbi-kyc-update.xyz/verify?ref=KYC2026 . Call 9876543210 for assistance. -SBI Team',
    fallbackResult: {
      risk_score: 92,
      verdict: 'High Risk Scam',
      impersonated_entity: 'Bank',
      highlighted_phrases: [
        'Your SBI account will be blocked within 24 hours',
        'incomplete KYC verification',
        'Update your KYC immediately',
        'Call 9876543210 for assistance',
      ],
      phrase_annotations: [
        {
          phrase: 'Your SBI account will be blocked within 24 hours',
          reason: 'Artificial urgency designed to cause panic before you check official channels.',
        },
        {
          phrase: 'incomplete KYC verification',
          reason: 'Common phishing lure claiming regulatory compliance issues.',
        },
        {
          phrase: 'Update your KYC immediately',
          reason: 'High-pressure call to action urging immediate compliance.',
        },
        {
          phrase: 'Call 9876543210 for assistance',
          reason: 'Fake support number routing directly to criminal phone operators.',
        },
      ],
      risk_explanation:
        'This message impersonates State Bank of India and threatens to block your account to create panic. The URL sbi-kyc-update.xyz is NOT an official SBI domain — it leads to a phishing page designed to steal your Internet Banking credentials, debit card details, and OTP. Banks never ask customers to update KYC via SMS links.',
      tactics_used: [
        'Artificial Urgency',
        'Lookalike Domain (.xyz TLD)',
        'Fear of Account Loss',
        'Fake Customer Support Number',
        'Brand Impersonation (SBI)',
      ],
      safe_next_steps: [
        'Do NOT click the link or call the number in this message.',
        'Report this SMS to SBI by forwarding it to 9223766666 or calling their official helpline 1800-11-2211.',
        'File a complaint at https://cybercrime.gov.in or call the national cyber helpline 1930.',
        'Check your KYC status only via the official SBI YONO app or by visiting your branch in person.',
      ],
    },
  },
  {
    id: 'delivery-courier',
    title: 'Fake Delivery SMS',
    shortDescription: 'India Post "address incomplete" with shortened link',
    channel: 'SMS',
    senderLabel: 'India Post',
    expectedRisk: 'High Risk',
    message:
      'India Post: Your package #IN4829371 cannot be delivered due to incomplete address information. Please update your delivery details within 24hrs: https://bit.ly/indiapost-redeliver to avoid return to sender. -India Post',
    fallbackResult: {
      risk_score: 88,
      verdict: 'High Risk Scam',
      impersonated_entity: 'Delivery Service',
      highlighted_phrases: [
        'cannot be delivered',
        'incomplete address information',
        'update your delivery details within 24hrs',
        'avoid return to sender',
      ],
      phrase_annotations: [
        {
          phrase: 'cannot be delivered',
          reason: 'Generic failure notification sent en masse to catch package recipients.',
        },
        {
          phrase: 'incomplete address information',
          reason: 'Bait to solicit personal delivery and payment address details.',
        },
        {
          phrase: 'update your delivery details within 24hrs',
          reason: 'Arbitrary 24-hour deadline to prevent independent verification.',
        },
        {
          phrase: 'avoid return to sender',
          reason: 'Creates fear of lost merchandise or delayed parcels.',
        },
      ],
      risk_explanation:
        'This message impersonates India Post using a fake delivery failure notification. The bit.ly shortened link hides a fraudulent checkout website where victims are asked to pay a tiny fee (₹5–₹25) for redelivery, capturing debit card numbers and OTPs.',
      tactics_used: [
        'Artificial Urgency',
        'URL Shortener Obfuscation (bit.ly)',
        'Brand Impersonation (India Post)',
        'Fear of Loss (package return)',
        'Micro-Payment Credential Harvesting Trap',
      ],
      safe_next_steps: [
        'Never click shortened links (bit.ly, tinyurl) claiming to be from postal or courier services.',
        'Track packages only on the official website: https://www.indiapost.gov.in using your actual tracking number.',
        'India Post never charges redelivery fees via SMS links.',
        'Report phishing SMS to your telecom operator and the cybercrime portal (1930).',
      ],
    },
  },
  {
    id: 'govt-pmkisan',
    title: 'Fake Govt Scheme',
    shortDescription: 'PM-Kisan refund with malicious .apk download',
    channel: 'WhatsApp',
    senderLabel: 'Ministry of Agriculture',
    expectedRisk: 'High Risk',
    message:
      'PM-Kisan Yojana: Congratulations! ₹6000 has been credited to your account under PM Kisan Samman Nidhi. Download the verification app to claim your payment: https://pm-kisan-verify.top/app.apk . Share this message with your family members! -Ministry of Agriculture',
    fallbackResult: {
      risk_score: 95,
      verdict: 'High Risk Scam',
      impersonated_entity: 'Government Organisation',
      highlighted_phrases: [
        'Congratulations! ₹6000 has been credited',
        'Download the verification app',
        'https://pm-kisan-verify.top/app.apk',
        'Share this message with your family members',
      ],
      phrase_annotations: [
        {
          phrase: 'Congratulations! ₹6000 has been credited',
          reason: 'Financial reward hook exploiting government welfare schemes.',
        },
        {
          phrase: 'Download the verification app',
          reason: 'Malware delivery trick instructing you to install untrusted software.',
        },
        {
          phrase: 'https://pm-kisan-verify.top/app.apk',
          reason: 'Direct Android APK file on an unofficial .top domain.',
        },
        {
          phrase: 'Share this message with your family members',
          reason: 'Viral chain forwarding tactic to propagate the scam to relatives.',
        },
      ],
      risk_explanation:
        'This scam exploits Indian government welfare schemes (PM-Kisan) by offering fake monetary benefits. The link downloads an untrusted Android .apk file containing spyware/banking trojans that read SMS OTPs, access contacts, and execute unauthorized bank transfers.',
      tactics_used: [
        'Government Scheme Exploitation (PM-Kisan)',
        'Malicious .APK Sideloading',
        'Suspicious TLD (.top)',
        'Financial Lure (₹6000 Credit)',
        'Viral Chain-Forwarding Social Engineering',
      ],
      safe_next_steps: [
        'DO NOT download or install the .apk file — it is banking malware.',
        'If already downloaded, do NOT open or grant accessibility permissions. Delete the file immediately and run a malware scan.',
        'Check genuine PM-Kisan status only at the official government portal: https://pmkisan.gov.in.',
        'Warn family members who may have received this forward, and report it on cybercrime.gov.in / 1930.',
      ],
    },
  },
  {
    id: 'genuine-bank',
    title: 'Genuine Bank Alert',
    shortDescription: 'Real SBI transaction alert (zero false positives)',
    channel: 'SMS',
    senderLabel: 'SBI',
    expectedRisk: 'Safe',
    message:
      'SBI: INR 2,500.00 debited from A/c XX4821 on 21-11-2026. Info: UPI/SWIGGY. If not done by you, call 1800111109. Available bal: INR 15,432.50 -SBI',
    fallbackResult: {
      risk_score: 5,
      verdict: 'Safe',
      impersonated_entity: 'None',
      highlighted_phrases: [],
      phrase_annotations: [],
      risk_explanation:
        'This is a standard, legitimate debit alert from State Bank of India. It contains no clickable links, requests no action unless unauthorized, references legitimate transactions, and directs fraud disputes to official toll-free numbers.',
      tactics_used: [],
      safe_next_steps: [
        'No immediate action required if you made this transaction.',
        'If you did not authorize this payment, call SBI immediately at 1800-11-1109 or block your card via the YONO app.',
        'Always verify transactions in your bank passbook or official banking app.',
      ],
    },
  },
];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function findFallbackPreset(
  presetId?: string,
  message?: string,
): DemoPreset | undefined {
  if (presetId) {
    const byId = DEMO_PRESETS.find(
      (p) =>
        p.id === presetId ||
        (presetId === 'fake-bank' && p.id === 'bank-kyc') ||
        (presetId === 'fake-delivery' && p.id === 'delivery-courier') ||
        (presetId === 'fake-govt' && p.id === 'govt-pmkisan') ||
        (presetId === 'genuine-alert' && p.id === 'genuine-bank'),
    );
    if (byId) return byId;
  }
  if (message) {
    const norm = normalizeText(message);
    const found = DEMO_PRESETS.find((p) => {
      const pNorm = normalizeText(p.message);
      return pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm);
    });
    if (found) return found;
  }
  return undefined;
}
