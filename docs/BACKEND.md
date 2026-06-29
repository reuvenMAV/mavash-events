# Backend architecture & migration path

## Google Apps Script quotas (current backend)

Apps Script is the **default backend for MVP**. Be aware of limits:

| Limit | Typical value |
|-------|----------------|
| Execution time per request | **6 minutes** max |
| Daily URL Fetch / triggers | quota per Google account |
| Concurrent executions | shared pool |

Heavy workloads (50 photos × many users) can hit execution time or daily quotas.  
**Mitigation today:** client-side image compression, batched uploads (10), rate limiting on `/api/events`.

**Future:** swap `GasEventsBackend` → `FirestoreEventsBackend` (or Supabase) without changing React components — only `src/lib/backend/`.

**Integrations:** n8n/HERMES webhooks, Sheets hybrid, image assets — see [INTEGRATIONS.md](INTEGRATIONS.md).

---

## Abstraction layer

```
Components  →  events-api.ts  →  /api/events  →  EventsBackend interface  →  GAS (now) / DB (later)
```

- **Do not** call `GAS_WEB_APP_URL` from components.
- **Do not** import `gas-server.ts` outside `src/lib/backend/gas-adapter.ts`.

To add a new backend: implement `EventsBackend` in `src/lib/backend/` and set `EVENTS_BACKEND=firestore` in env.

---

## Google Sheets as database (scale note)

Sheets works as a **low–medium volume DB** (dozens of events, hundreds–low thousands of guests).  
Guest search/filter in the dashboard scans rows in memory — fine for MVP.

If you run **many parallel events** or **10k+ guests** with heavy concurrent writes, migrate to a real DB. The abstraction layer above is the intended migration point; frontend stays unchanged.

---

## Access tokens (security)

Every guest invite link includes a token:

```
/e/noam-bar-mitzvah?t=EVENT_OR_GUEST_TOKEN
```

- **Event `publicToken`** — shared link (QR on invitation). Access only that event.
- **Guest `inviteToken`** — personal link; RSVP updates that guest row.

Without a valid token, public write APIs return 403.
