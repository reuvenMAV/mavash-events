# אינטגרציות — ניצול תשתית קיימת (HERMES)

מטרה: **לא לבנות הכל ב-Apps Script/Vercel בלבד**. MAVASH Events מתחבר ל-HERMES/JARVIS דרך n8n, Green API, Telegram, וכלי תמונות קיימים.

```
אורח / דשבורד  →  /api/events  →  GAS + Sheets
                      │
                      └─► n8n webhook (HERMES)  →  WhatsApp / Telegram / Airtable / PDF
```

---

## 1. יצירת תמונות (Image generation)

**אל תעצב מאפס** — השתמש ב-skill `image` + `mcp-image` ל-assets:

| נכס | שימוש | פורמט מומלץ |
|-----|--------|-------------|
| אייקונים / אמוג'י מותאמים | ניווט, דשבורד | 1:1, רקע שקוף אם אפשר |
| תבנית ספר ברכות דיגיטלי | רקע ל-PDF / דף ברכות | 3:4 או A4 |
| כרטיס הזמנה + QR | הדפסה / שליחה בוואטסאפ | 4:5 או 9:16 |

### תהליך

1. מלאו `docs/inputs/brand_guidelines.md` (צבעי אירוע, פונט, מוטיבים).
2. הריצו את skill **image** עם פרומפט לפי סוג האירוע (`bar_mitzvah`, `wedding`…).
3. שמרו ב-`public/events/{slug}/` או ב-Vercel Blob — **לא** ב-GAS.
4. בדשבורד: קישור לכרטיס מעוצב עם `?t={publicToken}` מוטמע ב-QR (ספריית `qrcode` ב-n8n או ב-build חד-פעמי).

פרטים: [docs/IMAGE_ASSETS.md](IMAGE_ASSETS.md)

---

## 2. Google Sheets — חיבור ישיר (היברידי)

כבר קיים אצלך ב-**raouben-site** (`src/lib/sheets.ts`): Service Account + `googleapis` לקריאה/כתיבה ישירה.

### מתי זה מחליף חלק מ-GAS

| פעולה | GAS (MVP) | Sheets API ישיר |
|--------|-----------|-----------------|
| RSVP / ברכות / תמונות | ✅ (Drive + validation) | ❌ השאירו ב-GAS |
| דשבורד: רשימת מוזמנים | דרך GAS | ✅ אפשר ב-n8n או Vercel |
| תזכורות cron (מי לא ענה) | כבד ב-GAS | ✅ n8n קורא Sheets ישירות |
| סטטיסטיקות | GAS | ✅ שתי הדרכים |

### הגדרה (אופציונלי)

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
SPREADSHEET_ID=
EVENTS_BACKEND=gas          # ברירת מחדל
# EVENTS_BACKEND=sheets-hybrid  # עתידי — קריאות admin דרך Sheets
```

שתפו את אותו Service Account לגיליון `MAVASH Events` (Viewer/Editor לפי צורך).

קוד: `src/lib/sheets-direct.ts` — זיהוי credentials; מימוש מלא יישב ב-`SheetsEventsBackend` כשתרצו.

---

## 3. n8n / HERMES — אוטומציות

### Webhook מהאפליקציה

אחרי פעולות מוצלחות, `/api/events` שולח אירוע ל-n8n (לא חוסם את המשתמש):

| `type` | מתי | דוגמה לשימוש ב-n8n |
|--------|-----|---------------------|
| `rsvp.submitted` | אישור הגעה | WhatsApp למארגנים; עדכון Airtable |
| `blessing.added` | ברכה חדשה | Telegram ל-JARVIS |
| `photos.uploaded` | העלאת תמונות | התראה + ספירה |

### משתני סביבה (Vercel)

```env
N8N_EVENTS_WEBHOOK_URL=https://your-n8n/webhook/mavash-events-hermes
N8N_EVENTS_WEBHOOK_KEY=shared-secret   # אופציונלי — n8n בודק x-hermes-key
```

### Workflow מוכן

- קובץ: `docs/n8n-workflow-events-hermes.json`
- פריסה: `scripts/n8n-deploy-events-hermes.sh` (דורש `N8N_BASE_URL`, `N8N_API_KEY`)

### זרימות מומלצות (שלב 6)

1. **תזכורת RSVP** — Cron ב-n8n → קרא Guests מ-Sheets → סנן `pending` + תאריך אירוע קרוב → Green API WhatsApp עם קישור `?t=inviteToken`.
2. **התראת ברכה/תמונה** — Webhook → Telegram (credential קיים: `Telegram אישור הגעה` / portfolio).
3. **PDF ספר ברכות** — Webhook או Cron → אסוף Blessings מ-Sheets → HTML→PDF (n8n / שירות חיצוני) → Green API שלח ללקוח.

### חיבור ל-HERMES / JARVIS

- אותו `N8N_BASE_URL` כמו portfolio-dashboard ו-lead workflows.
- אירועים נשלחים עם `source: "mavash-events"` — ב-n8n אפשר לנתב ל-agent קיים או ל-Telegram של המפעיל.
- **אל תכפילו** לוגיקת WhatsApp ב-Vercel — הכל דרך nodes קיימים (`greenApi`, `telegram`).

---

## עקרון ארכיטקטורה

| שכבה | אחריות |
|------|--------|
| Next.js | UI, auth tokens, rate limit, **emit HERMES** |
| GAS | כתיבות transactional + Drive |
| Sheets API / n8n | קריאות bulk, cron, התראות, PDF |
| Image skill | נכסים ויזואליים בלבד |

כך המערכת **לא מבודדת** — היא עוד מקור אירועים ב-HERMES, לא אי נפרד.
