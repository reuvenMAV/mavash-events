# MAVASH Events — הקמה

## 1. Google Sheet

1. צור **Spreadsheet** חדש בשם `MAVASH Events`
2. העתק את ה-**Spreadsheet ID** מה-URL
3. (אופציונלי) צור תיקיית Drive `אירועים` והעתק את ה-Folder ID

## 2. Apps Script

1. בגיליון: **Extensions → Apps Script**
2. מחק את `Code.gs` והדבק את `apps-script/Code.gs` מהפרויקט
3. **Project Settings → Script Properties:**

| Property | ערך |
|----------|-----|
| `SPREADSHEET_ID` | מזהה הגיליון |
| `ADMIN_ACCESS_KEY` | סיסמת דשבורד (בחר בעצמך) |
| `EVENTS_ROOT_FOLDER_ID` | (אופציונלי) תיקיית אירועים ב-Drive |

4. הרץ פעם אחת `setupWorkbook_` מהעורך (או אחרי deploy: `action: setupSheets` עם admin key)
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. העתק את ה-URL
7. אחרי setup — בדוק ב-**Execution log** את `publicToken` של אירוע הדמו (לקישור אורח)

## 2b. HERMES / n8n (אופציונלי)

1. `bash scripts/n8n-deploy-events-hermes.sh` (דורש `N8N_BASE_URL`, `N8N_API_KEY`)
2. העתק webhook URL ל-`N8N_EVENTS_WEBHOOK_URL` ב-Vercel
3. `N8N_EVENTS_WEBHOOK_KEY` + ב-n8n: `HERMES_TELEGRAM_CHAT_ID`, credentials קיימים (Telegram / Green API)

ראה [INTEGRATIONS.md](INTEGRATIONS.md)

## 3. Vercel / מקומי

```bash
cd mavash-events
cp .env.local.example .env.local
# GAS_WEB_APP_URL=...
# ADMIN_ACCESS_KEY=... (אותה סיסמה כמו ב-Script)
npm install
npm run dev
```

## 4. בדיקה

- אורח (דורש טוקן): `http://localhost:3000/e/noam-bar-mitzvah?t=PUBLIC_TOKEN`
- ניהול: `http://localhost:3000/dashboard`

קישור הזמנה: `/e/{slug}?t={publicToken}` או `?t={inviteToken}` אישי למוזמן.

## ארכיטקטורה

ראה [docs/BACKEND.md](BACKEND.md) — abstraction layer, quota, rate limiting, מעבר עתידי ל-DB.  
ראה [docs/INTEGRATIONS.md](INTEGRATIONS.md) — n8n, Sheets hybrid, image assets.

## גיליונות (נוצרים אוטומטית)

| Sheet | תוכן |
|-------|------|
| Events | אירועים (slug, `publicToken`, מיתוג) |
| Guests | אישורי הגעה + `inviteToken` |
| Blessings | ספר ברכות |
| Photos | מטא-דאטה + קישור Drive |
| Logs | לוג פעולות |

## API Actions

| action | ציבורי | תיאור |
|--------|--------|--------|
| `getEvent` | 🔑 `accessToken` | פרטי אירוע לפי slug + טוקן |
| `submitRsvp` | 🔑 | אישור הגעה |
| `addBlessing` | 🔑 | ברכה |
| `uploadPhotos` | 🔑 | עד 50 תמונות (דחוסות בקליינט) |
| `listPhotos` | 🔑 | גלריה |
| `listEvents` | 🔒 admin | כל האירועים |
| `getStats` | 🔒 | סטטיסטיקות |
| `listGuests` | 🔒 | מוזמנים |
| `listBlessings` | 🔒 | ברכות |
| `createEvent` | 🔒 | אירוע חדש (+ `publicToken`) |

🔑 = דורש `accessToken` בגוף הבקשה (דרך `/api/events`)  
🔒 = דורש `x-admin-key`  
Rate limiting בסיסי per-IP/per-token על `/api/events`.
