# ScamShield — Hybrid AI Scam & Phishing Detection Engine

> **AURA Vibe Coding Hackathon Project**  
> A cybersecurity intelligence web application designed to protect citizens from Indian digital scams (SMS, WhatsApp, lookalike banking portals, courier redelivery traps, and fake government benefit APK malware) with **zero false positives** on genuine bank transactions.

---

## 🛡️ Key Features

- **Dual Input Scanner**:
  - Paste any suspicious SMS message, WhatsApp text, or URL.
  - Drag-and-drop / upload message screenshots with multimodal Gemini OCR transcription and visual fraud inspection.
- **Hybrid Detection Pipeline**:
  - **Fast JavaScript Heuristic Engine**: Sub-millisecond pre-scan detecting unencrypted HTTP links, URL shorteners (`bit.ly`, `tinyurl`), high-risk TLDs (`.xyz`, `.top`), `.apk` download URLs, and credential harvesting patterns (OTP/PIN/CVV requests).
  - **Gemini 3.5 Flash Lite Model**: Deep semantic assessment returning a calibrated 0–100 threat score, target impersonation classification, exact manipulative substrings, plain-language risk mechanics, and actionable safety next steps.
  - **Resilient Fallback Mode**: Embedded verified sample intelligence ensuring smooth demo execution even when offline or rate-limited.
- **Interactive Cyber Intelligence Dashboard**:
  - **Threat Assessment Score Gauge**: Animated circular gauge with dynamic ambient glow indicators for Safe (<30), Suspicious (30–69), and High Risk (≥70).
  - **Annotated Message View**: Real-time syntax highlighting for deceptive phrases with hover tooltips explaining the psychological coercion tactics.
  - **Link Safety Inspection**: Visual breakdown of audited URLs with protocol verification, shortener resolution alerts, and domain risk tags.
  - **Risk Explanation & Action Plan**: Simple explanations of scam mechanics and 1-click links for India's **National Cybercrime Helpline 1930** and **cybercrime.gov.in**.
- **Dual-Theme Design**:
  - Sleek borderless dark mode (`#070708`) and soft warm pastel light mode (`#F8F6F0`).

---

## ⚡ 4 One-Click Demo Presets

1. **Fake Bank KYC** (`VM-SBIKYC`): Urgent account-block countdown with `http://sbi-kyc-update.xyz` lookalike link asking for OTP & ATM PIN.
2. **Fake Delivery SMS** (`AD-INDPST`): India Post incomplete address notice with a shortened `bit.ly` link and ₹25 redelivery fee trap.
3. **Fake Govt Scheme** (`PM-KISAN`): Income Tax / PM-Kisan ₹6,000 refund WhatsApp message delivering a malicious `.apk` installer.
4. **Genuine Bank Alert** (`SBI`): Real UPI/Swiggy debit alert with standard fraud prevention reminder to prove **0 false positives**.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/BijitChoudhury/AURA-Vibe-Coding-Hackathon.git
cd AURA-Vibe-Coding-Hackathon
npm install --legacy-peer-deps
```

### 2. Configure Environment (Optional)
Create a `.env` file in the root directory (samples also work offline with pre-built intelligence):
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```
*(You can also input your Gemini API key directly in the web app header).*

### 3. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, tsx
- **AI / Multimodal**: Google GenAI SDK (`@google/genai`), Gemini 3.5 Flash Lite
- **Heuristics**: Custom regex-based domain and credential extraction engine
