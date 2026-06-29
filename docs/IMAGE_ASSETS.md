# נכסים ויזואליים — Image generation

**לא לעצב מאפס ב-Figma/CSS** לכרטיסי הזמנה, רקעי ספר ברכות, או אייקונים מותאמים.

## כלים

- Cursor skill: `image` (קורא `docs/inputs/brand_guidelines.md`)
- MCP: `mcp-image` → `generate_image`

## לפני יצירה

1. עדכנו `docs/inputs/brand_guidelines.md` לפי האירוע (צבעים מ-`theme` ב-Sheets).
2. הגדירו `slug` וסוג אירוע.

## פרומפטים לדוגמה

### כרטיס הזמנה + מקום ל-QR

```
Elegant Hebrew bar mitzvah invitation card, navy blue and gold,
minimal typography, empty white square bottom-right for QR code,
print-ready, no English text, warm celebratory mood
```

### רקע ספר ברכות דיגיטלי

```
Soft cream paper texture background for digital guest book,
subtle floral border, bar mitzvah theme, navy and gold accents,
portrait A4 ratio, space in center for handwritten blessing text
```

### אייקון מודול (RSVP / ברכות / תמונות)

```
Flat minimal icon set, three icons: checkmark RSVP, envelope blessing, camera photos,
navy and gold on transparent, consistent stroke width, 1:1
```

## אחסון

| מיקום | מתי |
|--------|-----|
| `public/events/{slug}/invite-card.jpg` | כרטיס סטטי באתר |
| Vercel Blob | גרסאות רבות / CDN |
| Drive (תיקיית אירוע) | קבצים למארגנים בלבד |

## QR לקישור אורח

הקישור: `{SITE_URL}/e/{slug}?t={publicToken}`

יצירת QR — ב-n8n (node QR) או בכלי חיצוני; **לא** ב-Apps Script.

## אחרי יצירה

הדביקו URL בגיליון Events (עמודה עתידית `inviteAssetUrl`) או בהגדרות דשבורד — לא חובה ל-MVP.
