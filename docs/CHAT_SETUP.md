# צ'אט באתר + WhatsApp — MAVASH Events

## מה נבנה

| רכיב | תיאור |
|------|--------|
| **ChatWidget** | בועת צ'אט בכל דף (מלבד דשבורד) → `/api/chat` → n8n |
| **WhatsAppFloat** | כפתור וואטסאפ ירוק (Green API / wa.me) |
| **n8n workflow** | `docs/n8n-workflow-events-chat.json` — אתר + הודעות נכנסות מ-Green API |
| **אווטאר** | `public/chat/assistant-avatar.png` |

## 1. פריסת workflow ל-n8n

```bash
cd mavash-events
./scripts/n8n-deploy-events-chat.sh
```

דורש `N8N_BASE_URL` + `N8N_API_KEY` (כמו portfolio-dashboard).

## 2. משתני סביבה — Vercel

```env
# URL מלא מהפלט של סקריפט הפריסה
N8N_CHAT_WEBHOOK_URL=https://newsite.mavash.net/webhook/b8e4f1a2-3c6d-4e8f-9a1b-2d3e4f5a6b7c/chat
N8N_CHAT_WEBHOOK_KEY=          # אופציונלי — אם מוגדר ב-n8n
NEXT_PUBLIC_WHATSAPP_NUMBER=972544223911
```

## 3. Green API — WhatsApp דו-כיווני

ב-[Green API Console](https://console.green-api.com) → Instance → Webhooks:

- **Webhook URL:** `https://newsite.mavash.net/webhook/mavash-events-wa-in`
- אירוע: `incomingMessageReceived`

הודעות נכנסות עוברות לאותו AI Agent ומוחזרות דרך node `WhatsApp Reply to User`.

## 4. משתני n8n

| משתנה | ערך |
|--------|-----|
| `SITE_URL` | `https://mavash-events.vercel.app` |
| `SERVICE_NAME` | `MAVASH Events — פלטפורמת אירועים` |
| `LEAD_SERVICE_KEY` | `mavash_events` |
| `LEAD_ALERT_CHAT_ID` | `972544223911@c.us` (התראת ליד חדש) |

## 5. CORS ב-Chat Trigger

ב-n8n → **When chat message received** → Allowed Origins:

```
http://localhost:3000,https://mavash-events.vercel.app
```

## 6. בדיקה

```bash
npm run dev
```

פתח http://localhost:3000 → **צ'אט עם יועץ** → שלח "היי".

בדיקת WhatsApp: שלח הודעה למספר Green API — אמורה להגיע תשובת הבוט.
