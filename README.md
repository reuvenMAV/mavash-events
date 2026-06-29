# MAVASH Events — Phase 2

פלטפורמת מעורבות לאירוע: זהות אורח, מעקב פתיחות, תזכורות, ספר זיכרונות, פיד חי.  
**Next.js → `/api/events` → Google Apps Script → Sheets + Drive + Docs**

**Live:** https://mavash-events.vercel.app

## זרימת אורח (QR / קישור אישי)

```
/event/{eventId}?guest={guestId}
```

1. פתיחת קישור → `trackOpen`
2. RSVP (שם ממולא מראש)
3. תודה → ברכה (אופציונלי) → תמונות → סיום

זרימה רציפה ללא תפריט ניווט.

## ניהול (`/admin`)

| טאב | תוכן |
|-----|------|
| אורחים | סטטוס מעורבות, QR, יצירת אורח חדש |
| פיד חי | ActivityLog בזמן אמת |
| RSVP / ברכות / תמונות | טבלאות |
| ספר זיכרונות | Google Doc + PDF |

## Sheets (מקור האמת)

| גיליון | תפקיד |
|--------|--------|
| Guests | זהות + inviteUrl + qrUrl + openCount |
| RSVPs | אישורי הגעה |
| Blessings | ברכות |
| Photos | מטא-דאטה תמונות |
| ActivityLog | ציר זמן |
| Reminders | תזכורות שנשלחו |
| MemoryBooks | קישורי Doc/PDF |

## GAS Endpoints

| Action | תיאור |
|--------|--------|
| `createGuest` | admin — אורח + QR |
| `trackOpen` | מעקב פתיחה |
| `rsvp` | אישור (אורח קיים או חדש) |
| `blessing` / `uploadPhoto` | מעורבות |
| `listGuestsEngagement` | admin — סטטוס אורחים |
| `listActivity` | admin — פיד |
| `generateMemoryBook` | ספר זיכרונות |
| `setupReminders` | הפעלת triggers יומיים |

## Script Properties

```
SPREADSHEET_ID
ADMIN_ACCESS_KEY
EVENTS_ROOT_FOLDER_ID
SITE_BASE_URL=https://mavash-events.vercel.app
WHATSAPP_WEBHOOK_URL  (אופציונלי)
```

## התקנה

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

1. הדבק `apps-script/Code.gs` ב-Apps Script
2. הרץ `installMavashEvents()` — יוצר גיליונות + triggers
3. פרוס Web App + עדכן `GAS_WEB_APP_URL` ב-Vercel

- אורח (QR): `/event/{eventId}?guest={guestId}`
- אורח (legacy): `/e/noam-bar-mitzvah?t=TOKEN`
- ניהול: `/admin`
