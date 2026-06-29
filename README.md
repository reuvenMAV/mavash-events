# MAVASH Events

מערכת אירועים מודולרית — RSVP, ברכות, תמונות, דשבורד.  
**Next.js (Vercel) → `/api/events` → Apps Script → Sheets + Drive**

## מודולים

| מודול | סטטוס |
|-------|--------|
| RSVP | ✅ |
| ספר ברכות | ✅ |
| העלאת תמונות (דחיסה בקליינט, עד 50) | ✅ |
| Dashboard (4 מסכים) | ✅ |
| אירועים מרובים (slug) | ✅ |
| טוקן גישה לאורח (`?t=`) | ✅ |
| Abstraction layer (מעבר עתידי ל-DB) | ✅ |
| Rate limiting בסיסי | ✅ |
| HERMES / n8n webhooks | ✅ (emit + workflow template) |
| Sheets hybrid / תמונות AI | 📋 תיעוד + hooks |
| תזכורות WhatsApp / PDF ברכות | 🔜 n8n (שלב 6) |

## התחלה

ראה [docs/SETUP.md](docs/SETUP.md), [docs/BACKEND.md](docs/BACKEND.md), [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md)

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

- אורח: `/e/noam-bar-mitzvah?t=YOUR_PUBLIC_TOKEN`
- ניהול: `/dashboard`
