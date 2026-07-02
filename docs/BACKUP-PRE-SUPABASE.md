# גיבוי לפני מעבר Supabase (owner events)

**תאריך:** 2026-07-02  
**ענף גיבוי:** `backup/pre-supabase-2026-07-02`  
**קומיט:** `019ed30`

## מה נשמר

- GAS adapter עם מיפוי `createEvent` / `listEvents` (פרודקשן עובד)
- OAuth Google (`getUserByEmail` + `createUser`)
- זרימת אורח (ברכה/תמונות ללא RSVP בקישור token)
- n8n צ'אט

## חזרה למצב עובד (rollback)

```bash
git checkout backup/pre-supabase-2026-07-02
# או ב-Vercel: promote deployment קודם מ-Dashboard
```

ב-Vercel env — **אל** תגדירו `OWNER_EVENTS_SOURCE=supabase` (השאירו ריק או `gas`).

## שחזור אחרי מעבר Supabase

אם Supabase גורם לבעיות בדשבורד בלבד:

1. `OWNER_EVENTS_SOURCE=gas` ב-Vercel → Redeploy
2. אירועים שנוצרו ב-Supabase נשארים בטבלה — אורחים עדיין על GAS אם בוצע dual-write

## גיבוי נתונים חיצוני (מומלץ)

- Google Sheets: File → Download → Excel
- Apps Script: Extensions → Apps Script → הורדת `Code.gs`
- Vercel env: `vercel env pull .env.backup`
