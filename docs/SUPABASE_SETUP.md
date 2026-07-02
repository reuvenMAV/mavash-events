# Supabase — שלב 1 (בעלים בלבד)

## מה זה נותן

- יצירת אירוע + רשימת אירועים בדשבורד דרך Postgres
- **ברירת מחדל: GAS** — שום דבר לא משתנה עד שמפעילים במפורש
- **Dual-write:** אירוע חדש נשמר ב-Supabase **וגם** ב-GAS → קישור למוזמנים ממשיך לעבוד

## Rollback

ראו [BACKUP-PRE-SUPABASE.md](./BACKUP-PRE-SUPABASE.md).

## פרויקט Supabase (מוגדר)

- **Project:** `mavash-events`
- **Ref:** `vkdmskbgmcqlfsgjkxde`
- **URL:** `https://vkdmskbgmcqlfsgjkxde.supabase.co`
- **Region:** Europe (eu-west-1)

## 1. פרויקט Supabase

1. [supabase.com](https://supabase.com) → New project
2. SQL Editor → הריצו את `supabase/migrations/001_events.sql`

## 2. מפתחות (Vercel — Production)

| משתנה | ערך |
|--------|-----|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (Settings → API) |
| `OWNER_EVENTS_SOURCE` | `supabase` (או `auto`) |

**אל** תשימו service_role בדפדפן — רק ב-Vercel server env.

## 3. הפעלה הדרגתית

```bash
# שלב א — רק קוד, בלי שינוי התנהגות (ברירת מחדל)
OWNER_EVENTS_SOURCE=gas   # או לא להגדיר

# שלב ב — אחרי SQL + מפתחות
OWNER_EVENTS_SOURCE=supabase
```

`EVENTS_BACKEND` — השאירו `hybrid` (ברירת מחדל) או ריק.

## 4. בדיקה

1. `/dashboard/new` → צור אירוע
2. `/dashboard` → מופיע ברשימה
3. קישור אורח `/e/{slug}?t={token}` → עדיין עובד (GAS sync)

## שלבים הבאים (לא מומש עדיין)

- RSVP / ברכות → Supabase
- תמונות → Supabase Storage
- כיבוי GAS
