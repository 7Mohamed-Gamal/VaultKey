# KeyVault & API Sync - Requirements & Environment Specifications

## Runtime & Engine Requirements
- Node.js >= 18.0.0 (LTS v20.x recommended)
- npm >= 9.0.0 (or pnpm / yarn)
- Operating System: Windows 10 / 11, macOS, Linux

## Key Libraries & Stack
- **Framework**: React 19.x with Vite 6.x & TypeScript
- **Styling**: Tailwind CSS v4.x (via @tailwindcss/vite)
- **Icons**: Lucide React
- **Animations & Effects**: Motion (motion/react), Canvas-Confetti
- **Extension Packaging**: JSZip
- **AI Integration**: Google GenAI SDK (@google/genai)

## Environment Variables (.env)
- `GEMINI_API_KEY`: (Optional) Required if utilizing server-side AI expansions.
- `APP_URL`: (Optional) Base application URL for cloud deployments.

*Note: For local client execution, no mandatory environment variables are required as storage defaults securely to Browser LocalStorage and Google Identity Client-side OAuth.*
