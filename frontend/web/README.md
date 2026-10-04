# Web chat (Next.js + TypeScript)

Farmer chat used for the demo. Calls the FastAPI backend through a server-side proxy,
so the API key never reaches the browser.

## Run
```bash
npm install
copy .env.example .env.local      # macOS/Linux: cp .env.example .env.local
npm run dev
```
Open http://localhost:3000 (redirects to /chat). The backend must be running on port 8000.

## Files
- `app/chat/page.tsx` – chat page
- `app/api/ask/route.ts` – proxy to FastAPI `/ask` (adds X-API-Key)
- `components/ChatWindow.tsx` – conversation, starter questions, composer
- `components/MessageBubble.tsx`, `SourceList.tsx`, `LanguageToggle.tsx`
- `lib/strings.ts` – Kinyarwanda/English interface text (review Kinyarwanda)
- Later: `app/dashboard/*` for admin, answer review and analytics
