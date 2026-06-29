/**
 * MAVASH Events — Google Apps Script API
 * Sheets: Events | Guests | Blessings | Photos | Logs
 * Deploy: Web App → Execute as Me → Anyone
 *
 * QUOTA: max ~6 min execution per request; daily trigger/url-fetch limits.
 * Client compresses images + Next.js rate-limits /api/events to stay within quota.
 * Future: replace this backend via EventsBackend (Firestore/Supabase) — see docs/BACKEND.md
 *
 * Script Properties:
 *   SPREADSHEET_ID — workbook ID
 *   ADMIN_ACCESS_KEY — bootstrap only (legacy)
 *   INTERNAL_API_SECRET — server-to-server from Vercel (tenant scoping)
 *   EVENTS_ROOT_FOLDER_ID — optional Drive root "אירועים"
 */

const SHEETS = {
  USERS: "Users",
  EVENTS: "Events",
  GUESTS: "Guests",
  BLESSINGS: "Blessings",
  PHOTOS: "Photos",
  LOGS: "Logs",
};

const HEADERS = {
  Users: ["userId", "email", "passwordHash", "plan", "createdAt"],
  Events: [
    "eventId",
    "tenantId",
    "slug",
    "name",
    "type",
    "date",
    "venue",
    "tagline",
    "themeJson",
    "driveFolderId",
    "publicToken",
    "active",
    "createdAt",
  ],
  Guests: [
    "guestId",
    "tenantId",
    "eventId",
    "name",
    "phone",
    "status",
    "guestsCount",
    "notes",
    "inviteToken",
    "respondedAt",
    "createdAt",
  ],
  Blessings: ["blessingId", "tenantId", "eventId", "guestName", "message", "createdAt"],
  Photos: [
    "photoId",
    "tenantId",
    "eventId",
    "fileName",
    "driveFileId",
    "driveUrl",
    "uploadedBy",
    "createdAt",
  ],
  Logs: ["logId", "tenantId", "eventId", "action", "details", "createdAt"],
};

function doGet(e) {
  const api = String((e && e.parameter && e.parameter.api) || "").trim();
  if (api === "ping") {
    return jsonResponse_({ ok: true, service: "mavash-events", version: 1 });
  }
  return jsonResponse_({ error: "Unknown API" }, 404);
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || "").trim();
    const adminKey = getAdminKeyFromRequest_(e, body);
    const tenantId = getTenantFromRequest_(body);

    switch (action) {
      case "getUserByEmail":
        requireInternal_(body);
        return jsonResponse_(getUserByEmail_(String(body.email || "")));
      case "createUser":
        requireInternal_(body);
        return jsonResponse_(createUser_(body));
      case "adminPing":
        requireAdmin_(adminKey);
        return jsonResponse_({ ok: true });
      case "setupSheets":
        requireAdmin_(adminKey);
        setupWorkbook_();
        return jsonResponse_({ success: true });
      case "listEvents":
        if (tenantId) {
          return jsonResponse_({ events: listEventsForTenant_(tenantId) });
        }
        requireAdmin_(adminKey);
        return jsonResponse_({ events: listEvents_() });
      case "getEvent":
        return jsonResponse_(getEventPublic_(body));
      case "getStats":
        if (tenantId) {
          return jsonResponse_({
            stats: getStatsForTenant_(String(body.slug || ""), tenantId),
          });
        }
        requireAdmin_(adminKey);
        return jsonResponse_({
          stats: getStats_(String(body.slug || "")),
        });
      case "submitRsvp":
        return jsonResponse_(submitRsvp_(body));
      case "listGuests":
        if (tenantId) {
          return jsonResponse_({
            guests: listGuestsForTenant_(String(body.slug || ""), tenantId),
          });
        }
        requireAdmin_(adminKey);
        return jsonResponse_({
          guests: listGuests_(String(body.slug || "")),
        });
      case "addBlessing":
        return jsonResponse_(addBlessing_(body));
      case "listBlessings":
        if (tenantId) {
          return jsonResponse_({
            blessings: listBlessingsForTenant_(String(body.slug || ""), tenantId),
          });
        }
        requireAdmin_(adminKey);
        return jsonResponse_({
          blessings: listBlessings_(String(body.slug || "")),
        });
      case "uploadPhotos":
        return jsonResponse_(uploadPhotos_(body));
      case "listPhotos":
        if (tenantId) {
          return jsonResponse_({
            photos: listPhotosForTenant_(String(body.slug || ""), tenantId),
          });
        }
        if (adminKey) {
          requireAdmin_(adminKey);
          return jsonResponse_({
            photos: listPhotos_(String(body.slug || "")),
          });
        }
        return jsonResponse_(listPhotosPublic_(body));
      case "createEvent":
        if (tenantId) {
          return jsonResponse_(createEvent_(body, tenantId));
        }
        requireAdmin_(adminKey);
        return jsonResponse_(createEvent_(body, ""));
      default:
        return jsonResponse_({ error: "Unknown action: " + action }, 400);
    }
  } catch (err) {
    return jsonResponse_(
      { error: err && err.message ? err.message : String(err) },
      400
    );
  }
}

/** One-time: run from editor or call setupSheets via API */
function setupWorkbook_() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    ensureSheet_(ss, SHEETS[name] || name, HEADERS[name]);
  });
  migrateTokenColumns_();
  migrateTenantColumns_();
  backfillPublicTokens_();
  seedDemoEventIfEmpty_();
}

/** Add publicToken / inviteToken columns on existing workbooks */
function migrateTokenColumns_() {
  const ss = getSpreadsheet_();
  ensureColumn_(ss.getSheetByName(SHEETS.EVENTS), "publicToken");
  ensureColumn_(ss.getSheetByName(SHEETS.GUESTS), "inviteToken");
}

function migrateTenantColumns_() {
  const ss = getSpreadsheet_();
  ensureColumn_(ss.getSheetByName(SHEETS.EVENTS), "tenantId");
  ensureColumn_(ss.getSheetByName(SHEETS.GUESTS), "tenantId");
  ensureColumn_(ss.getSheetByName(SHEETS.BLESSINGS), "tenantId");
  ensureColumn_(ss.getSheetByName(SHEETS.PHOTOS), "tenantId");
  ensureColumn_(ss.getSheetByName(SHEETS.LOGS), "tenantId");
  ensureSheet_(ss, SHEETS.USERS, HEADERS.Users);
}

function ensureColumn_(sheet, colName) {
  if (!sheet) return;
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (headers.indexOf(colName) === -1) {
    sheet.getRange(1, headers.length + 1).setValue(colName);
  }
}

function backfillPublicTokens_() {
  const rows = sheetToObjects_(SHEETS.EVENTS);
  rows.forEach(function (row) {
    if (!String(row.publicToken || "").trim()) {
      updateEventField_(String(row.eventId), "publicToken", token_());
    }
  });
}

function seedDemoEventIfEmpty_() {
  const events = sheetToObjects_(SHEETS.EVENTS);
  if (events.length > 0) return;
  const created = createEvent_({
    slug: "noam-bar-mitzvah",
    name: "בר מצווה של נועם",
    type: "bar_mitzvah",
    date: "2026-07-15",
    venue: "אולם אירועים, תל אביב",
    tagline: "נשמח לראותכם איתנו ביום המיוחד",
    theme: { primary: "#1e3a5f", accent: "#c9a227", background: "#faf8f5" },
  });
  Logger.log("Demo invite link token (publicToken): " + created.publicToken);
}

function createEvent_(body, tenantId) {
  const slug = slugify_(String(body.slug || body.name || ""));
  if (!slug) throw new Error("חסר slug");
  const tid = String(tenantId || body.tenantId || "").trim();
  if (tid && getEventBySlugForTenant_(slug, tid)) {
    throw new Error("slug כבר קיים באירועים שלך");
  }
  if (!tid && getEventBySlug_(slug)) throw new Error("slug כבר קיים");

  const eventId = uuid_();
  const publicToken = token_();
  const folderId = ensureEventDriveFolder_(String(body.name || slug));
  const themeJson = body.theme ? JSON.stringify(body.theme) : "";

  appendRow_(SHEETS.EVENTS, {
    eventId: eventId,
    tenantId: tid,
    slug: slug,
    name: String(body.name || slug),
    type: String(body.type || "other"),
    date: String(body.date || ""),
    venue: String(body.venue || ""),
    tagline: String(body.tagline || ""),
    themeJson: themeJson,
    driveFolderId: folderId,
    publicToken: publicToken,
    active: "TRUE",
    createdAt: nowIso_(),
  });

  log_(eventId, tid, "createEvent", slug);
  return { success: true, eventId: eventId, slug: slug, publicToken: publicToken };
}

function submitRsvp_(body) {
  const slug = String(body.slug || "").trim();
  const name = String(body.name || "").trim();
  const status = String(body.status || "").trim();
  const guestsCount = parseInt(body.guestsCount, 10) || 0;

  if (!slug || !name) throw new Error("חסר שם");
  if (status !== "yes" && status !== "no") throw new Error("סטטוס לא תקין");

  const access = validateAccess_(slug, body.accessToken);

  if (access.guestId) {
    updateGuestRsvp_(access.guestId, {
      name: name,
      phone: String(body.phone || ""),
      status: status,
      guestsCount: status === "yes" ? Math.max(1, guestsCount) : 0,
      notes: String(body.notes || ""),
    });
    log_(access.event.eventId, access.event.tenantId || "", "rsvp", name + " → " + status + " (invite)");
    return { success: true, guestId: access.guestId };
  }

  const guestId = uuid_();
  const inviteToken = token_();
  appendRow_(SHEETS.GUESTS, {
    guestId: guestId,
    tenantId: access.event.tenantId || "",
    eventId: access.event.eventId,
    name: name,
    phone: String(body.phone || ""),
    status: status,
    guestsCount: status === "yes" ? Math.max(1, guestsCount) : 0,
    notes: String(body.notes || ""),
    inviteToken: inviteToken,
    respondedAt: nowIso_(),
    createdAt: nowIso_(),
  });

  log_(access.event.eventId, access.event.tenantId || "", "rsvp", name + " → " + status);
  return { success: true, guestId: guestId, inviteToken: inviteToken };
}

function addBlessing_(body) {
  const slug = String(body.slug || "").trim();
  const guestName = String(body.guestName || "").trim();
  const message = String(body.message || "").trim();
  if (!guestName || !message) throw new Error("חסר שם או ברכה");

  const access = validateAccess_(slug, body.accessToken);

  const blessingId = uuid_();
  appendRow_(SHEETS.BLESSINGS, {
    blessingId: blessingId,
    tenantId: access.event.tenantId || "",
    eventId: access.event.eventId,
    guestName: guestName,
    message: message,
    createdAt: nowIso_(),
  });

  log_(access.event.eventId, access.event.tenantId || "", "blessing", guestName);
  return { success: true, blessingId: blessingId };
}

function uploadPhotos_(body) {
  const slug = String(body.slug || "").trim();
  const files = body.files || [];
  if (!files.length) throw new Error("לא נבחרו קבצים");
  if (files.length > 50) throw new Error("מקסימום 50 תמונות בבת אחת");

  const access = validateAccess_(slug, body.accessToken);
  const event = access.event;
  const MAX_FILE_BYTES = 3 * 1024 * 1024;

  const folderId = event.driveFolderId || ensureEventDriveFolder_(event.name);
  const photoIds = [];

  files.forEach(function (file) {
    const bytes = Utilities.base64Decode(String(file.dataBase64 || ""));
    if (bytes.length > MAX_FILE_BYTES) {
      throw new Error("קובץ גדול מדי — דחסו בצד הלקוח לפני העלאה");
    }
    const blob = Utilities.newBlob(bytes, file.mimeType || "image/jpeg", file.name || "photo.jpg");
    const driveFile = DriveApp.getFolderById(folderId).createFile(blob);
    const photoId = uuid_();
    appendRow_(SHEETS.PHOTOS, {
      photoId: photoId,
      tenantId: event.tenantId || "",
      eventId: event.eventId,
      fileName: file.name || driveFile.getName(),
      driveFileId: driveFile.getId(),
      driveUrl: driveFile.getUrl(),
      uploadedBy: String(body.uploadedBy || ""),
      createdAt: nowIso_(),
    });
    photoIds.push(photoId);
  });

  log_(event.eventId, event.tenantId || "", "uploadPhotos", String(photoIds.length) + " files");
  return { success: true, photoIds: photoIds };
}

function listEvents_() {
  return sheetToObjects_(SHEETS.EVENTS)
    .filter(function (e) {
      return String(e.active).toUpperCase() === "TRUE";
    })
    .map(mapEventRow_);
}

function listEventsForTenant_(tenantId) {
  return sheetToObjects_(SHEETS.EVENTS)
    .filter(function (e) {
      return (
        String(e.active).toUpperCase() === "TRUE" &&
        String(e.tenantId || "") === String(tenantId)
      );
    })
    .map(mapEventRow_);
}

function getEventBySlug_(slug) {
  const row = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === slug;
  });
  return row ? mapEventRow_(row) : null;
}

function getEventBySlugForTenant_(slug, tenantId) {
  const row = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === slug && String(e.tenantId || "") === String(tenantId);
  });
  return row ? mapEventRow_(row) : null;
}

function getStatsForTenant_(slug, tenantId) {
  const event = getEventBySlugForTenant_(slug, tenantId);
  if (!event) throw new Error("אין הרשאה");
  return getStatsForEvent_(event);
}

function listGuestsForTenant_(slug, tenantId) {
  const event = getEventBySlugForTenant_(slug, tenantId);
  if (!event) throw new Error("אין הרשאה");
  return listGuestsByEventId_(event.eventId);
}

function listBlessingsForTenant_(slug, tenantId) {
  const event = getEventBySlugForTenant_(slug, tenantId);
  if (!event) throw new Error("אין הרשאה");
  return listBlessingsByEventId_(event.eventId);
}

function listPhotosForTenant_(slug, tenantId) {
  const event = getEventBySlugForTenant_(slug, tenantId);
  if (!event) throw new Error("אין הרשאה");
  return listPhotosByEventId_(event.eventId);
}

function getStats_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  return getStatsForEvent_(event);
}

function getStatsForEvent_(event) {
  const guests = listGuestsByEventId_(event.eventId);
  let confirmed = 0;
  let declined = 0;
  let pending = 0;
  let guestsAttending = 0;

  guests.forEach(function (g) {
    if (g.status === "yes") {
      confirmed++;
      guestsAttending += parseInt(g.guestsCount, 10) || 0;
    } else if (g.status === "no") {
      declined++;
    } else {
      pending++;
    }
  });

  const blessings = listBlessingsByEventId_(event.eventId);
  const photos = listPhotosByEventId_(event.eventId);

  return {
    guestsTotal: guests.length,
    confirmed: confirmed,
    declined: declined,
    pending: pending,
    guestsAttending: guestsAttending,
    blessingsCount: blessings.length,
    photosCount: photos.length,
  };
}

function getEventPublic_(body) {
  const access = validateAccess_(String(body.slug || ""), body.accessToken);
  return { event: access.event, guestId: access.guestId };
}

function listPhotosPublic_(body) {
  const access = validateAccess_(String(body.slug || ""), body.accessToken);
  return { photos: listPhotosByEventId_(access.event.eventId) };
}

/**
 * Event publicToken (shared invite) or guest inviteToken (personal link).
 * Prevents cross-event access when only slug is known.
 */
function validateAccess_(slug, accessToken) {
  const token = String(accessToken || "").trim();
  if (!token) throw new Error("נדרש קוד גישה לאירוע");

  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");

  const eventRow = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === slug;
  });
  if (eventRow && String(eventRow.publicToken || "") === token) {
    return { event: event, guestId: null };
  }

  const guest = sheetToObjects_(SHEETS.GUESTS).find(function (g) {
    return String(g.eventId) === event.eventId && String(g.inviteToken || "") === token;
  });
  if (guest) {
    return { event: event, guestId: String(guest.guestId) };
  }

  throw new Error("קוד גישה לא תקין");
}

function updateGuestRsvp_(guestId, fields) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.GUESTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  const idCol = headers.indexOf("guestId");
  if (idCol < 0) throw new Error("guestId column missing");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(guestId)) {
      headers.forEach(function (h, j) {
        if (fields[h] != null) data[i][j] = fields[h];
      });
      if (fields.status) data[i][headers.indexOf("respondedAt")] = nowIso_();
      sheet.getRange(i + 1, 1, i + 1, headers.length).setValues([data[i]]);
      return;
    }
  }
  throw new Error("מוזמן לא נמצא");
}

function updateEventField_(eventId, field, value) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.EVENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  const idCol = headers.indexOf("eventId");
  const fieldCol = headers.indexOf(field);
  if (idCol < 0 || fieldCol < 0) return;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(eventId)) {
      sheet.getRange(i + 1, fieldCol + 1).setValue(value);
      return;
    }
  }
}

function listGuests_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  // SCALE: in-memory scan — fine for hundreds/low thousands of guests (Sheets as DB).
  // For 10k+ guests or heavy concurrent search, migrate to Firestore/Supabase.
  return listGuestsByEventId_(event.eventId);
}

function listBlessings_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  return listBlessingsByEventId_(event.eventId);
}

function listPhotos_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  return listPhotosByEventId_(event.eventId);
}

function listGuestsByEventId_(eventId) {
  return sheetToObjects_(SHEETS.GUESTS).filter(function (g) {
    return String(g.eventId) === eventId;
  });
}

function listBlessingsByEventId_(eventId) {
  return sheetToObjects_(SHEETS.BLESSINGS)
    .filter(function (b) {
      return String(b.eventId) === eventId;
    })
    .reverse();
}

function listPhotosByEventId_(eventId) {
  return sheetToObjects_(SHEETS.PHOTOS)
    .filter(function (p) {
      return String(p.eventId) === eventId;
    })
    .reverse();
}

function mapEventRow_(row) {
  var theme = null;
  try {
    if (row.themeJson) theme = JSON.parse(row.themeJson);
  } catch (e) {}
  return {
    eventId: String(row.eventId),
    tenantId: String(row.tenantId || ""),
    slug: String(row.slug),
    name: String(row.name),
    type: String(row.type),
    date: String(row.date),
    venue: String(row.venue),
    tagline: String(row.tagline || ""),
    theme: theme,
    driveFolderId: String(row.driveFolderId || ""),
    active: String(row.active).toUpperCase() === "TRUE",
  };
}

function ensureEventDriveFolder_(eventName) {
  const rootId = PropertiesService.getScriptProperties().getProperty("EVENTS_ROOT_FOLDER_ID");
  var parent;
  if (rootId) {
    parent = DriveApp.getFolderById(rootId);
  } else {
    parent = DriveApp.getRootFolder();
  }
  const safeName = String(eventName || "Event").substring(0, 80);
  const folders = parent.getFoldersByName(safeName);
  if (folders.hasNext()) {
    const folder = folders.next();
    const photos = folder.getFoldersByName("Photos");
    if (!photos.hasNext()) folder.createFolder("Photos");
    return folder.getId();
  }
  const folder = parent.createFolder(safeName);
  folder.createFolder("Photos");
  return folder.getId();
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("הגדר SPREADSHEET_ID ב-Script Properties");
}

/** Run from editor toolbar — public entry (underscore helpers are hidden from Run menu) */
function installMavashEvents() {
  const result = installMavashEvents_();
  Logger.log(JSON.stringify(result));
  return result;
}

/** One-time after clasp push — sets properties, sheets, demo event */
function installMavashEvents_() {
  const props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var id = props.getProperty("SPREADSHEET_ID");
    if (!id) id = "1jHjc--VLQaSThlGYjSTCJa-Z45KuDMbokdQUphaN8So";
    ss = SpreadsheetApp.openById(id);
  }
  props.setProperty("SPREADSHEET_ID", ss.getId());
  if (!props.getProperty("ADMIN_ACCESS_KEY")) {
    props.setProperty("ADMIN_ACCESS_KEY", Utilities.getUuid().replace(/-/g, "").substring(0, 24));
  }
  setupWorkbook_();
  const demo = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === "noam-bar-mitzvah";
  });
  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    adminAccessKey: props.getProperty("ADMIN_ACCESS_KEY"),
    publicToken: demo ? String(demo.publicToken || "") : "",
    slug: "noam-bar-mitzvah",
  };
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToObjects_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    headers.forEach(function (h, j) {
      obj[h] = values[i][j];
    });
    rows.push(obj);
  }
  return rows;
}

function appendRow_(sheetName, obj) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (h) {
    return obj[h] != null ? obj[h] : "";
  });
  sheet.appendRow(row);
}

function log_(eventId, tenantId, action, details) {
  appendRow_(SHEETS.LOGS, {
    logId: uuid_(),
    tenantId: String(tenantId || ""),
    eventId: eventId,
    action: action,
    details: String(details || ""),
    createdAt: nowIso_(),
  });
}

function requireInternal_(body) {
  const expected = PropertiesService.getScriptProperties().getProperty("INTERNAL_API_SECRET");
  if (!expected || String(body.internalSecret || "") !== String(expected)) {
    throw new Error("אין הרשאה");
  }
}

function getTenantFromRequest_(body) {
  if (!body || !body.internalSecret) return "";
  requireInternal_(body);
  return String(body.tenantId || "").trim();
}

function getUserByEmail_(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return { user: null };
  const user = sheetToObjects_(SHEETS.USERS).find(function (u) {
    return String(u.email || "").toLowerCase() === normalized;
  });
  if (!user) return { user: null };
  return {
    user: {
      userId: String(user.userId),
      email: String(user.email),
      passwordHash: String(user.passwordHash || ""),
      plan: String(user.plan || "free"),
      createdAt: String(user.createdAt || ""),
    },
  };
}

function createUser_(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const passwordHash = String(body.passwordHash || "");
  if (!email || !passwordHash) throw new Error("חסר email או passwordHash");
  const existing = getUserByEmail_(email);
  if (existing.user) throw new Error("משתמש כבר קיים");
  const userId = uuid_();
  appendRow_(SHEETS.USERS, {
    userId: userId,
    email: email,
    passwordHash: passwordHash,
    plan: String(body.plan || "free"),
    createdAt: nowIso_(),
  });
  return { userId: userId, email: email, plan: "free" };
}

function requireAdmin_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_ACCESS_KEY");
  if (!expected || String(key) !== String(expected)) {
    throw new Error("אין הרשאה");
  }
}

function getAdminKeyFromRequest_(e, body) {
  if (body && body.adminKey) return String(body.adminKey);
  if (e && e.parameter && e.parameter.adminKey) return String(e.parameter.adminKey);
  return "";
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function jsonResponse_(obj, status) {
  var output = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
  return output;
}

function token_() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "").substring(0, 8);
}

function uuid_() {
  return Utilities.getUuid();
}

function nowIso_() {
  return new Date().toISOString();
}

function slugify_(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
