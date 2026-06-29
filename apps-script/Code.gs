/**
 * MAVASH Events — Phase 2 Backend (Google Apps Script only)
 * Sheets: Events | Guests | RSVPs | Blessings | Photos | ActivityLog | Reminders | MemoryBooks
 * Drive: events/{eventId}/photos/ | events/{eventId}/qr/ | events/{eventId}/memory/
 *
 * Script Properties: SPREADSHEET_ID, ADMIN_ACCESS_KEY, EVENTS_ROOT_FOLDER_ID, SITE_BASE_URL
 */

const SHEETS = {
  EVENTS: "Events",
  GUESTS: "Guests",
  RSVPS: "RSVPs",
  BLESSINGS: "Blessings",
  PHOTOS: "Photos",
  ACTIVITY: "ActivityLog",
  REMINDERS: "Reminders",
  MEMORY: "MemoryBooks",
  USERS: "Users",
};

const HEADERS = {
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
  Users: ["userId", "email", "passwordHash", "plan", "createdAt"],
  Guests: [
    "guestId",
    "eventId",
    "name",
    "phone",
    "email",
    "inviteUrl",
    "qrUrl",
    "openCount",
    "firstOpenedAt",
    "lastOpenedAt",
    "createdAt",
  ],
  RSVPs: [
    "rsvpId",
    "guestId",
    "eventId",
    "attending",
    "guestsCount",
    "notes",
    "createdAt",
  ],
  Blessings: ["blessingId", "guestId", "eventId", "message", "createdAt"],
  Photos: [
    "photoId",
    "guestId",
    "eventId",
    "fileName",
    "driveFileId",
    "driveUrl",
    "createdAt",
  ],
  ActivityLog: ["logId", "timestamp", "eventId", "guestId", "actionType", "metadata"],
  Reminders: [
    "reminderId",
    "guestId",
    "eventId",
    "reminderType",
    "reminderSent",
    "reminderTimestamp",
    "channel",
  ],
  MemoryBooks: [
    "memoryId",
    "eventId",
    "docUrl",
    "pdfUrl",
    "createdAt",
  ],
};

function doGet(e) {
  try {
    const api = String((e && e.parameter && e.parameter.api) || "").trim();
    const adminKey = getAdminKeyFromRequest_(e, null);
    const slug = String((e && e.parameter && e.parameter.slug) || "").trim();

    if (api === "ping") {
      return jsonResponse_({ ok: true, service: "mavash-events", version: 3 });
    }
    if (api === "rsvps") {
      requireAdmin_(adminKey);
      return jsonResponse_({ rsvps: listRsvps_(slug) });
    }
    if (api === "photos") {
      requireAdmin_(adminKey);
      return jsonResponse_({ photos: listPhotos_(slug) });
    }
    if (api === "blessings") {
      requireAdmin_(adminKey);
      return jsonResponse_({ blessings: listBlessings_(slug) });
    }
    return jsonResponse_({ error: "Unknown API" }, 404);
  } catch (err) {
    return jsonResponse_({ error: err.message || String(err) }, 400);
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || "").trim();
    const adminKey = getAdminKeyFromRequest_(e, body);

    switch (action) {
      case "adminPing":
        requireAdmin_(adminKey);
        return jsonResponse_({ ok: true });
      case "setupSheets":
        requireAdmin_(adminKey);
        setupWorkbook_();
        return jsonResponse_({ success: true });
      case "setupReminders":
        requireAdmin_(adminKey);
        installReminderTriggers_();
        return jsonResponse_({ success: true });
      case "getEvent":
        return jsonResponse_(getEventPublic_(body));
      case "getEventById":
        return jsonResponse_(getEventByIdPublic_(body));
      case "getGuest":
        return jsonResponse_(getGuestPublic_(body));
      case "trackOpen":
        return jsonResponse_(trackOpen_(body));
      case "rsvp":
      case "submitRsvp":
        return jsonResponse_(submitRsvp_(body));
      case "getRsvps":
      case "listRsvps":
        requireAdmin_(adminKey);
        return jsonResponse_({ rsvps: listRsvps_(String(body.slug || "")) });
      case "blessing":
      case "addBlessing":
        return jsonResponse_(addBlessing_(body));
      case "listBlessings":
        requireAdmin_(adminKey);
        return jsonResponse_({ blessings: listBlessings_(String(body.slug || "")) });
      case "uploadPhoto":
      case "uploadPhotos":
        return jsonResponse_(uploadPhotos_(body));
      case "photos":
      case "listPhotos":
        if (adminKey) {
          requireAdmin_(adminKey);
          return jsonResponse_({ photos: listPhotos_(String(body.slug || "")) });
        }
        return jsonResponse_(listPhotosPublic_(body));
      case "createGuest":
        requireAdmin_(adminKey);
        return jsonResponse_(createGuest_(body));
      case "listGuestsEngagement":
        requireAdmin_(adminKey);
        return jsonResponse_({
          guests: listGuestsEngagement_(String(body.slug || "")),
        });
      case "listActivity":
        requireAdmin_(adminKey);
        return jsonResponse_({
          activity: listActivity_(String(body.slug || "")),
        });
      case "listReminders":
        requireAdmin_(adminKey);
        return jsonResponse_({
          reminders: listReminders_(String(body.slug || "")),
        });
      case "generateMemoryBook":
        requireAdmin_(adminKey);
        return jsonResponse_(generateMemoryBook_(String(body.slug || "")));
      case "getMemoryBook":
        requireAdmin_(adminKey);
        return jsonResponse_(getMemoryBook_(String(body.slug || "")));
      case "markComplete":
        return jsonResponse_(markGuestComplete_(body));
      case "createUser":
        return jsonResponse_(createUser_(body));
      case "getUserByEmail":
        return jsonResponse_(getUserByEmail_(body));
      case "ownerListEvents":
        return jsonResponse_(ownerListEvents_(body));
      case "ownerCreateEvent":
        return jsonResponse_(ownerCreateEvent_(body));
      case "ownerGetStats":
        return jsonResponse_(ownerGetStats_(body));
      case "ownerListGuests":
        return jsonResponse_(ownerListGuests_(body));
      case "ownerListBlessings":
        return jsonResponse_(ownerListBlessings_(body));
      case "ownerListPhotos":
        return jsonResponse_(ownerListPhotos_(body));
      case "ownerListGuestsEngagement":
        return jsonResponse_(ownerListGuestsEngagement_(body));
      case "ownerListActivity":
        return jsonResponse_(ownerListActivity_(body));
      case "ownerCreateGuest":
        return jsonResponse_(ownerCreateGuest_(body));
      case "ownerGenerateMemoryBook":
        return jsonResponse_(ownerGenerateMemoryBook_(body));
      case "ownerGetMemoryBook":
        return jsonResponse_(ownerGetMemoryBook_(body));
      case "ownerGetRsvps":
        return jsonResponse_(ownerGetRsvps_(body));
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

// ─── Setup ───────────────────────────────────────────────────────────────────

function setupWorkbook_() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    ensureSheet_(ss, SHEETS[name] || name, HEADERS[name]);
  });
  ensureColumn_(ss.getSheetByName(SHEETS.EVENTS), "publicToken");
  ensureColumn_(ss.getSheetByName(SHEETS.EVENTS), "tenantId");
  backfillGuestColumns_();
  backfillPublicTokens_();
  seedDemoEventIfEmpty_();
}

function backfillGuestColumns_() {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.GUESTS);
  if (!sheet) return;
  ["email", "inviteUrl", "qrUrl", "openCount", "firstOpenedAt", "lastOpenedAt"].forEach(
    function (col) {
      ensureColumn_(sheet, col);
    }
  );
}

function seedDemoEventIfEmpty_() {
  const events = sheetToObjects_(SHEETS.EVENTS);
  if (events.length > 0) return;
  const eventId = uuid_();
  const slug = "noam-bar-mitzvah";
  const publicToken = token_();
  const folderId = ensureEventPhotosFolder_(eventId);
  appendRow_(SHEETS.EVENTS, {
    eventId: eventId,
    tenantId: "demo",
    slug: slug,
    name: "בר מצווה של אבנר",
    type: "bar_mitzvah",
    date: "2026-07-15",
    venue: "אולם אירועים, תל אביב",
    tagline: "נשמח לראותכם איתנו ביום המיוחד",
    themeJson: JSON.stringify({
      primary: "#1e3a5f",
      accent: "#c9a227",
      background: "#faf8f5",
    }),
    driveFolderId: folderId,
    publicToken: publicToken,
    active: "TRUE",
    createdAt: nowIso_(),
  });
}

// ─── Guest identity & QR ─────────────────────────────────────────────────────

function createGuest_(body) {
  const slug = String(body.slug || "").trim();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  if (!slug || !name) throw new Error("חסר שם או slug");

  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");

  const guestId = uuid_();
  const now = nowIso_();
  const qr = generateQrForGuest_(event, guestId);

  appendRow_(SHEETS.GUESTS, {
    guestId: guestId,
    eventId: event.eventId,
    name: name,
    phone: phone,
    email: email,
    inviteUrl: qr.inviteUrl,
    qrUrl: qr.qrUrl,
    openCount: 0,
    firstOpenedAt: "",
    lastOpenedAt: "",
    createdAt: now,
  });

  logActivity_(event.eventId, guestId, "guest_created", { name: name });

  return {
    success: true,
    guestId: guestId,
    inviteUrl: qr.inviteUrl,
    qrUrl: qr.qrUrl,
  };
}

function generateQrForGuest_(event, guestId) {
  const baseUrl =
    PropertiesService.getScriptProperties().getProperty("SITE_BASE_URL") ||
    "https://mavash-events.vercel.app";
  const inviteUrl =
    baseUrl +
    "/event/" +
    encodeURIComponent(event.eventId) +
    "?guest=" +
    encodeURIComponent(guestId);
  const qrApi =
    "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=" +
    encodeURIComponent(inviteUrl);
  const blob = UrlFetchApp.fetch(qrApi).getBlob().setName("qr-" + guestId + ".png");
  const folder = ensureEventQrFolder_(event.eventId);
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return { inviteUrl: inviteUrl, qrUrl: file.getUrl(), qrFileId: file.getId() };
}

function getGuestPublic_(body) {
  const guestId = String(body.guestId || "").trim();
  const eventId = String(body.eventId || "").trim();
  if (!guestId || !eventId) throw new Error("חסר מזהה אורח");

  const guest = getGuestById_(guestId);
  if (!guest || String(guest.eventId) !== eventId) throw new Error("אורח לא נמצא");

  const event = getEventById_(eventId);
  if (!event) throw new Error("אירוע לא נמצא");

  const rsvp = getRsvpForGuest_(guestId);
  const engagement = computeEngagement_(guest, rsvp);

  return {
    guest: {
      guestId: String(guest.guestId),
      name: String(guest.name || ""),
      phone: String(guest.phone || ""),
      engagement: engagement,
    },
    event: event,
    hasRsvp: Boolean(rsvp),
    rsvp: rsvp
      ? {
          attending: String(rsvp.attending),
          guestsCount: parseInt(rsvp.guestsCount, 10) || 0,
        }
      : null,
  };
}

function getEventByIdPublic_(body) {
  const eventId = String(body.eventId || "").trim();
  const guestId = String(body.guestId || "").trim();
  if (!eventId) throw new Error("חסר eventId");

  const event = getEventById_(eventId);
  if (!event) throw new Error("אירוע לא נמצא");

  if (guestId) {
    const guest = getGuestById_(guestId);
    if (!guest || String(guest.eventId) !== eventId) throw new Error("אורח לא נמצא");
    return getGuestPublic_(body);
  }

  throw new Error("נדרש guestId");
}

// ─── Open tracking ───────────────────────────────────────────────────────────

function trackOpen_(body) {
  const guestId = String(body.guestId || "").trim();
  const eventId = String(body.eventId || "").trim();
  if (!guestId || !eventId) throw new Error("חסר מזהה");

  const guest = getGuestById_(guestId);
  if (!guest || String(guest.eventId) !== eventId) throw new Error("אורח לא נמצא");

  const now = nowIso_();
  const openCount = (parseInt(guest.openCount, 10) || 0) + 1;
  const firstOpened = String(guest.firstOpenedAt || "").trim() || now;

  updateGuestFields_(guestId, {
    openCount: openCount,
    firstOpenedAt: firstOpened,
    lastOpenedAt: now,
  });

  if (openCount === 1) {
    logActivity_(eventId, guestId, "opened", { firstOpen: true });
  } else {
    logActivity_(eventId, guestId, "opened", { openCount: openCount });
  }

  return { success: true, openCount: openCount, firstOpenedAt: firstOpened };
}

// ─── RSVP ────────────────────────────────────────────────────────────────────

function submitRsvp_(body) {
  const slug = String(body.slug || "").trim();
  const eventId = String(body.eventId || "").trim();
  const existingGuestId = String(body.guestId || "").trim();
  const name = String(body.name || "").trim();
  const attending = String(body.attending || body.status || "").trim();
  const guestsCount = parseInt(body.guestsCount, 10) || 0;
  const notes = String(body.notes || "").trim();
  const phone = String(body.phone || "").trim();

  if (!name) throw new Error("חסר שם");
  if (attending !== "yes" && attending !== "no") throw new Error("סטטוס לא תקין");

  var event;
  var guestId;

  if (existingGuestId) {
    const ctx = resolveGuestContext_(body);
    event = ctx.event;
    guestId = existingGuestId;
    if (getRsvpForGuest_(guestId)) throw new Error("כבר נרשמתם לאירוע");
    updateGuestFields_(guestId, { name: name, phone: phone });
  } else if (slug && body.accessToken) {
    event = resolveEventAccess_(slug, body.accessToken);
    guestId = null;
  } else {
    throw new Error("נדרש קוד גישה או מזהה אורח");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error("שרת עמוס — נסו שוב");

  try {
    const now = nowIso_();
    const count = attending === "yes" ? Math.max(1, guestsCount) : 0;

    if (!guestId) {
      guestId = uuid_();
      const qr = generateQrForGuest_(event, guestId);
      appendRow_(SHEETS.GUESTS, {
        guestId: guestId,
        eventId: event.eventId,
        name: name,
        phone: phone,
        email: "",
        inviteUrl: qr.inviteUrl,
        qrUrl: qr.qrUrl,
        openCount: 0,
        firstOpenedAt: "",
        lastOpenedAt: "",
        createdAt: now,
      });
    }

    const rsvpId = uuid_();
    appendRow_(SHEETS.RSVPS, {
      rsvpId: rsvpId,
      guestId: guestId,
      eventId: event.eventId,
      attending: attending,
      guestsCount: count,
      notes: notes,
      createdAt: now,
    });

    logActivity_(event.eventId, guestId, "rsvp", {
      attending: attending,
      guestsCount: count,
    });

    return {
      success: true,
      guestId: guestId,
      rsvpId: rsvpId,
      attending: attending,
    };
  } finally {
    lock.releaseLock();
  }
}

function addBlessing_(body) {
  const guestId = String(body.guestId || "").trim();
  const message = String(body.message || "").trim();
  if (!guestId) throw new Error("חסר guestId");
  if (!message) throw new Error("חסרה ברכה");

  const ctx = resolveGuestContext_(body);
  const event = ctx.event;

  const blessingId = uuid_();
  appendRow_(SHEETS.BLESSINGS, {
    blessingId: blessingId,
    guestId: guestId,
    eventId: event.eventId,
    message: message,
    createdAt: nowIso_(),
  });

  logActivity_(event.eventId, guestId, "blessing", { blessingId: blessingId });

  return { success: true, blessingId: blessingId };
}

function uploadPhotos_(body) {
  const guestId = String(body.guestId || "").trim();
  const files =
    body.files || body.file
      ? [body.file].concat(body.files || []).filter(Boolean)
      : body.files || [];
  if (!files.length) throw new Error("לא נבחרו קבצים");
  if (files.length > 50) throw new Error("מקסימום 50 תמונות");

  const ctx = resolveGuestContext_(body);
  const event = ctx.event;
  if (guestId) requireGuestForEvent_(guestId, event.eventId);

  const folderId = ensureEventPhotosFolder_(event.eventId);
  const folder = DriveApp.getFolderById(folderId);
  const MAX_FILE_BYTES = 4 * 1024 * 1024;
  const results = [];

  files.forEach(function (file) {
    const bytes = Utilities.base64Decode(String(file.dataBase64 || ""));
    if (bytes.length > MAX_FILE_BYTES) {
      throw new Error("קובץ גדול מדי — דחסו לפני העלאה");
    }
    const blob = Utilities.newBlob(
      bytes,
      file.mimeType || "image/jpeg",
      file.name || "photo.jpg"
    );
    const driveFile = folder.createFile(blob);
    const photoId = uuid_();
    appendRow_(SHEETS.PHOTOS, {
      photoId: photoId,
      guestId: guestId,
      eventId: event.eventId,
      fileName: file.name || driveFile.getName(),
      driveFileId: driveFile.getId(),
      driveUrl: driveFile.getUrl(),
      createdAt: nowIso_(),
    });
    results.push({
      photoId: photoId,
      driveUrl: driveFile.getUrl(),
      driveFileId: driveFile.getId(),
    });
  });

  logActivity_(event.eventId, guestId, "photo_upload", { count: results.length });

  return {
    success: true,
    photos: results,
    photoIds: results.map(function (r) {
      return r.photoId;
    }),
  };
}

function markGuestComplete_(body) {
  const guestId = String(body.guestId || "").trim();
  const ctx = resolveGuestContext_(body);
  logActivity_(ctx.event.eventId, guestId, "completed", {});
  return { success: true };
}

// ─── Activity log ─────────────────────────────────────────────────────────────

function logActivity_(eventId, guestId, actionType, metadata) {
  appendRow_(SHEETS.ACTIVITY, {
    logId: uuid_(),
    timestamp: nowIso_(),
    eventId: eventId,
    guestId: guestId || "",
    actionType: actionType,
    metadata: JSON.stringify(metadata || {}),
  });
}

function listActivity_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  const guests = {};
  listGuestsByEventId_(event.eventId).forEach(function (g) {
    guests[String(g.guestId)] = g;
  });
  return sheetToObjects_(SHEETS.ACTIVITY)
    .filter(function (a) {
      return String(a.eventId) === event.eventId;
    })
    .map(function (a) {
      const g = guests[String(a.guestId)] || {};
      var meta = {};
      try {
        meta = JSON.parse(String(a.metadata || "{}"));
      } catch (e) {}
      return {
        logId: String(a.logId),
        timestamp: String(a.timestamp),
        guestId: String(a.guestId || ""),
        guestName: String(g.name || ""),
        actionType: String(a.actionType),
        metadata: meta,
      };
    })
    .reverse();
}

// ─── Guest engagement (admin) ─────────────────────────────────────────────────

function listGuestsEngagement_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");

  const rsvpMap = {};
  sheetToObjects_(SHEETS.RSVPS)
    .filter(function (r) {
      return String(r.eventId) === event.eventId;
    })
    .forEach(function (r) {
      rsvpMap[String(r.guestId)] = r;
    });

  const blessingSet = {};
  sheetToObjects_(SHEETS.BLESSINGS)
    .filter(function (b) {
      return String(b.eventId) === event.eventId;
    })
    .forEach(function (b) {
      blessingSet[String(b.guestId)] = true;
    });

  const photoSet = {};
  sheetToObjects_(SHEETS.PHOTOS)
    .filter(function (p) {
      return String(p.eventId) === event.eventId;
    })
    .forEach(function (p) {
      photoSet[String(p.guestId)] = true;
    });

  const completedSet = {};
  sheetToObjects_(SHEETS.ACTIVITY)
    .filter(function (a) {
      return String(a.eventId) === event.eventId && String(a.actionType) === "completed";
    })
    .forEach(function (a) {
      completedSet[String(a.guestId)] = true;
    });

  const reminderMap = {};
  sheetToObjects_(SHEETS.REMINDERS)
    .filter(function (r) {
      return String(r.eventId) === event.eventId;
    })
    .forEach(function (r) {
      const gid = String(r.guestId);
      if (!reminderMap[gid]) reminderMap[gid] = [];
      reminderMap[gid].push({
        type: String(r.reminderType),
        sent: String(r.reminderSent).toUpperCase() === "TRUE",
        at: String(r.reminderTimestamp || ""),
      });
    });

  return listGuestsByEventId_(event.eventId).map(function (g) {
    const gid = String(g.guestId);
    const rsvp = rsvpMap[gid];
    const engagement = computeEngagement_(g, rsvp, blessingSet[gid], photoSet[gid], completedSet[gid]);
    return {
      guestId: gid,
      name: String(g.name || ""),
      phone: String(g.phone || ""),
      email: String(g.email || ""),
      inviteUrl: String(g.inviteUrl || ""),
      qrUrl: String(g.qrUrl || ""),
      openCount: parseInt(g.openCount, 10) || 0,
      firstOpenedAt: String(g.firstOpenedAt || ""),
      lastOpenedAt: String(g.lastOpenedAt || ""),
      engagement: engagement,
      hasRsvp: Boolean(rsvp),
      attending: rsvp ? String(rsvp.attending) : "",
      reminders: reminderMap[gid] || [],
    };
  });
}

function computeEngagement_(guest, rsvp, hasBlessing, hasPhoto, completed) {
  if (completed) return "completed";
  if (rsvp && (hasBlessing || hasPhoto)) return "completed";
  if (rsvp) return "rsvp";
  if ((parseInt(guest.openCount, 10) || 0) > 0) return "opened";
  return "not_opened";
}

// ─── Reminders ────────────────────────────────────────────────────────────────

function installReminderTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const fn = t.getHandlerFunction();
    if (fn === "runDailyReminders" || fn === "runPostEventJobs") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("runDailyReminders").timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger("runPostEventJobs").timeBased().everyDays(1).atHour(10).create();
}

function runDailyReminders() {
  const events = sheetToObjects_(SHEETS.EVENTS);
  const today = startOfDay_(new Date());
  events.forEach(function (ev) {
    if (!ev.date) return;
    const eventDate = startOfDay_(new Date(String(ev.date) + "T12:00:00"));
    const daysUntil = Math.round((eventDate - today) / 86400000);
    if (daysUntil === 7) sendRemindersForEvent_(ev, "7day");
    if (daysUntil === 2) sendRemindersForEvent_(ev, "2day");
  });
}

function sendRemindersForEvent_(eventRow, reminderType) {
  const event = mapEventRow_(eventRow);
  const rsvpGuests = {};
  sheetToObjects_(SHEETS.RSVPS)
    .filter(function (r) {
      return String(r.eventId) === event.eventId;
    })
    .forEach(function (r) {
      rsvpGuests[String(r.guestId)] = true;
    });

  listGuestsByEventId_(event.eventId).forEach(function (guest) {
    const gid = String(guest.guestId);
    if (rsvpGuests[gid]) return;
    if (reminderAlreadySent_(gid, reminderType)) return;
    sendReminderToGuest_(guest, event, reminderType);
  });
}

function reminderAlreadySent_(guestId, reminderType) {
  return sheetToObjects_(SHEETS.REMINDERS).some(function (r) {
    return (
      String(r.guestId) === guestId &&
      String(r.reminderType) === reminderType &&
      String(r.reminderSent).toUpperCase() === "TRUE"
    );
  });
}

function sendReminderToGuest_(guest, event, reminderType) {
  const inviteUrl = String(guest.inviteUrl || "").trim();
  if (!inviteUrl) return;

  const subject = "תזכורת: " + event.name;
  const body =
    "שלום " +
    guest.name +
    ",\n\nנשמח לקבל את אישור ההגעה לאירוע " +
    event.name +
    ".\n\nלחצו כאן: " +
    inviteUrl +
    "\n\nתודה!";

  var channel = "pending";
  const email = String(guest.email || "").trim();

  if (email) {
    try {
      GmailApp.sendEmail(email, subject, body);
      channel = "email";
    } catch (e) {
      channel = "email_failed";
    }
  } else {
    const webhook = PropertiesService.getScriptProperties().getProperty("WHATSAPP_WEBHOOK_URL");
    if (webhook) {
      try {
        UrlFetchApp.fetch(webhook, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify({
            to: String(guest.phone || ""),
            message: body,
            guestId: String(guest.guestId),
            eventId: event.eventId,
          }),
          muteHttpExceptions: true,
        });
        channel = "whatsapp";
      } catch (e) {
        channel = "whatsapp_failed";
      }
    } else {
      channel = "logged_only";
      Logger.log("Reminder (no channel): " + guest.name + " — " + inviteUrl);
    }
  }

  appendRow_(SHEETS.REMINDERS, {
    reminderId: uuid_(),
    guestId: String(guest.guestId),
    eventId: event.eventId,
    reminderType: reminderType,
    reminderSent: "TRUE",
    reminderTimestamp: nowIso_(),
    channel: channel,
  });

  logActivity_(event.eventId, String(guest.guestId), "reminder_sent", {
    reminderType: reminderType,
    channel: channel,
  });
}

function listReminders_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  const guests = {};
  listGuestsByEventId_(event.eventId).forEach(function (g) {
    guests[String(g.guestId)] = g;
  });
  return sheetToObjects_(SHEETS.REMINDERS)
    .filter(function (r) {
      return String(r.eventId) === event.eventId;
    })
    .map(function (r) {
      const g = guests[String(r.guestId)] || {};
      return {
        reminderId: String(r.reminderId),
        guestId: String(r.guestId),
        guestName: String(g.name || ""),
        reminderType: String(r.reminderType),
        reminderSent: String(r.reminderSent).toUpperCase() === "TRUE",
        reminderTimestamp: String(r.reminderTimestamp || ""),
        channel: String(r.channel || ""),
      };
    })
    .reverse();
}

// ─── Memory book ──────────────────────────────────────────────────────────────

function runPostEventJobs() {
  const today = startOfDay_(new Date());
  sheetToObjects_(SHEETS.EVENTS).forEach(function (ev) {
    if (!ev.date) return;
    const eventDate = startOfDay_(new Date(String(ev.date) + "T12:00:00"));
    if (eventDate >= today) return;
    if (getMemoryBookRow_(String(ev.eventId))) return;
    try {
      generateMemoryBook_(String(ev.slug));
    } catch (e) {
      Logger.log("Memory book failed for " + ev.slug + ": " + e.message);
    }
  });
}

function generateMemoryBook_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");

  const existing = getMemoryBookRow_(event.eventId);
  if (existing) {
    return {
      success: true,
      docUrl: String(existing.docUrl),
      pdfUrl: String(existing.pdfUrl),
      existing: true,
    };
  }

  const doc = DocumentApp.create("ספר זיכרונות — " + event.name);
  const body = doc.getBody();
  body.setText("");
  body.appendParagraph(event.name).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(formatHeDate_(event.date) + " · " + event.venue).setHeading(
    DocumentApp.ParagraphHeading.SUBTITLE
  );
  if (event.tagline) body.appendParagraph(event.tagline);

  body.appendParagraph("").appendHorizontalRule();
  body.appendParagraph("אורחים").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  listRsvps_(slug).forEach(function (r) {
    body.appendParagraph(
      "• " +
        r.name +
        " — " +
        (r.attending === "yes" ? "מגיע (" + r.guestsCount + ")" : "לא מגיע")
    );
  });

  body.appendParagraph("").appendHorizontalRule();
  body.appendParagraph("ברכות").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  listBlessings_(slug).forEach(function (b) {
    body.appendParagraph(b.guestName + ":").setBold(true);
    body.appendParagraph(b.message);
    body.appendParagraph("");
  });

  body.appendParagraph("").appendHorizontalRule();
  body.appendParagraph("תמונות").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  listPhotos_(slug).forEach(function (p) {
    body.appendParagraph(p.fileName + ": " + p.driveUrl);
  });

  body.appendParagraph("").appendHorizontalRule();
  body.appendParagraph("ציר זמן").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  listActivity_(slug).forEach(function (a) {
    body.appendParagraph(
      formatActivityLabel_(a.actionType) +
        " — " +
        (a.guestName || "מערכת") +
        " · " +
        a.timestamp
    );
  });

  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const folder = ensureEventMemoryFolder_(event.eventId);
  const movedDoc = docFile.moveTo(folder);
  const pdfBlob = movedDoc.getAs("application/pdf");
  const pdfFile = folder.createFile(pdfBlob).setName("memory-book-" + event.slug + ".pdf");
  try {
    movedDoc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  const memoryId = uuid_();
  appendRow_(SHEETS.MEMORY, {
    memoryId: memoryId,
    eventId: event.eventId,
    docUrl: movedDoc.getUrl(),
    pdfUrl: pdfFile.getUrl(),
    createdAt: nowIso_(),
  });

  logActivity_(event.eventId, "", "memory_book_created", { memoryId: memoryId });

  return {
    success: true,
    docUrl: movedDoc.getUrl(),
    pdfUrl: pdfFile.getUrl(),
    existing: false,
  };
}

function getMemoryBook_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  const row = getMemoryBookRow_(event.eventId);
  if (!row) return { memoryBook: null };
  return {
    memoryBook: {
      docUrl: String(row.docUrl),
      pdfUrl: String(row.pdfUrl),
      createdAt: String(row.createdAt || ""),
    },
  };
}

function getMemoryBookRow_(eventId) {
  return sheetToObjects_(SHEETS.MEMORY).find(function (m) {
    return String(m.eventId) === eventId;
  });
}

function formatActivityLabel_(type) {
  const labels = {
    opened: "פתיחת הזמנה",
    rsvp: "אישור הגעה",
    blessing: "ברכה",
    photo_upload: "העלאת תמונות",
    completed: "סיום זרימה",
    guest_created: "אורח נוצר",
    reminder_sent: "תזכורת נשלחה",
    memory_book_created: "ספר זיכרונות",
  };
  return labels[type] || type;
}

function formatHeDate_(iso) {
  try {
    return Utilities.formatDate(new Date(iso + "T12:00:00"), "Asia/Jerusalem", "d MMMM yyyy");
  } catch (e) {
    return iso;
  }
}

// ─── List helpers ─────────────────────────────────────────────────────────────

function listRsvps_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  const guests = {};
  listGuestsByEventId_(event.eventId).forEach(function (g) {
    guests[String(g.guestId)] = g;
  });
  return sheetToObjects_(SHEETS.RSVPS)
    .filter(function (r) {
      return String(r.eventId) === event.eventId;
    })
    .map(function (r) {
      const g = guests[String(r.guestId)] || {};
      return {
        rsvpId: String(r.rsvpId),
        guestId: String(r.guestId),
        name: String(g.name || ""),
        phone: String(g.phone || ""),
        attending: String(r.attending),
        guestsCount: parseInt(r.guestsCount, 10) || 0,
        notes: String(r.notes || ""),
        createdAt: String(r.createdAt || ""),
      };
    })
    .reverse();
}

function listBlessings_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  const guests = {};
  listGuestsByEventId_(event.eventId).forEach(function (g) {
    guests[String(g.guestId)] = g;
  });
  return listBlessingsByEventId_(event.eventId).map(function (b) {
    const g = guests[String(b.guestId)] || {};
    return {
      blessingId: String(b.blessingId),
      guestId: String(b.guestId),
      guestName: String(g.name || ""),
      message: String(b.message),
      createdAt: String(b.createdAt || ""),
    };
  });
}

function listPhotos_(slug) {
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  return listPhotosByEventId_(event.eventId).map(mapPhotoRow_);
}

function listPhotosPublic_(body) {
  const ctx = resolveGuestContext_(body);
  return { photos: listPhotosByEventId_(ctx.event.eventId).map(mapPhotoRow_) };
}

function getEventPublic_(body) {
  const event = resolveEventAccess_(String(body.slug || ""), body.accessToken);
  return { event: event };
}

// ─── Access resolution ────────────────────────────────────────────────────────

function resolveGuestContext_(body) {
  const guestId = String(body.guestId || "").trim();
  const eventId = String(body.eventId || "").trim();
  const slug = String(body.slug || "").trim();

  if (guestId) {
    const guest = getGuestById_(guestId);
    if (!guest) throw new Error("אורח לא נמצא");
    const event = getEventById_(String(guest.eventId));
    if (!event) throw new Error("אירוע לא נמצא");
    if (eventId && event.eventId !== eventId) throw new Error("אירוע לא תואם");
    if (slug && event.slug !== slug) throw new Error("אירוע לא תואם");
    return { event: event, guest: guest };
  }

  if (slug && body.accessToken) {
    return { event: resolveEventAccess_(slug, body.accessToken), guest: null };
  }

  if (eventId) {
    const event = getEventById_(eventId);
    if (!event) throw new Error("אירוע לא נמצא");
    return { event: event, guest: null };
  }

  throw new Error("נדרש guestId או קוד גישה");
}

function resolveEventAccess_(slug, accessToken) {
  const token = String(accessToken || "").trim();
  if (!token) throw new Error("נדרש קוד גישה לאירוע");
  const event = getEventBySlug_(slug);
  if (!event) throw new Error("אירוע לא נמצא");
  const row = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === slug;
  });
  if (!row || String(row.publicToken || "") !== token) {
    throw new Error("קוד גישה לא תקין");
  }
  return event;
}

function requireGuestForEvent_(guestId, eventId) {
  const guest = getGuestById_(guestId);
  if (!guest || String(guest.eventId) !== String(eventId)) {
    throw new Error("אורח לא נמצא");
  }
}

function getGuestById_(guestId) {
  return sheetToObjects_(SHEETS.GUESTS).find(function (g) {
    return String(g.guestId) === String(guestId);
  });
}

function getRsvpForGuest_(guestId) {
  return sheetToObjects_(SHEETS.RSVPS).find(function (r) {
    return String(r.guestId) === String(guestId);
  });
}

function getEventBySlug_(slug) {
  const row = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === slug;
  });
  return row ? mapEventRow_(row) : null;
}

function getEventById_(eventId) {
  const row = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.eventId) === String(eventId);
  });
  return row ? mapEventRow_(row) : null;
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

function updateGuestFields_(guestId, fields) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.GUESTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  const idCol = headers.indexOf("guestId");
  if (idCol < 0) return;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(guestId)) {
      Object.keys(fields).forEach(function (key) {
        const col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(fields[key]);
      });
      return;
    }
  }
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
    type: String(row.type || "other"),
    date: String(row.date),
    venue: String(row.venue),
    tagline: String(row.tagline || ""),
    theme: theme,
    driveFolderId: String(row.driveFolderId || ""),
    active: String(row.active).toUpperCase() === "TRUE",
  };
}

function mapPhotoRow_(row) {
  return {
    photoId: String(row.photoId),
    guestId: String(row.guestId || ""),
    fileName: String(row.fileName),
    driveFileId: String(row.driveFileId),
    driveUrl: String(row.driveUrl),
    createdAt: String(row.createdAt || ""),
  };
}

// ─── Drive folders ────────────────────────────────────────────────────────────

function ensureEventPhotosFolder_(eventId) {
  const eventFolder = ensureEventRootFolder_(eventId);
  return getOrCreateSubfolder_(eventFolder, "photos").getId();
}

function ensureEventQrFolder_(eventId) {
  const eventFolder = ensureEventRootFolder_(eventId);
  return getOrCreateSubfolder_(eventFolder, "qr");
}

function ensureEventMemoryFolder_(eventId) {
  const eventFolder = ensureEventRootFolder_(eventId);
  return getOrCreateSubfolder_(eventFolder, "memory");
}

function ensureEventRootFolder_(eventId) {
  const rootId = PropertiesService.getScriptProperties().getProperty("EVENTS_ROOT_FOLDER_ID");
  var parent = rootId ? DriveApp.getFolderById(rootId) : DriveApp.getRootFolder();
  var eventsRoot = getOrCreateSubfolder_(parent, "events");
  return getOrCreateSubfolder_(eventsRoot, String(eventId));
}

function getOrCreateSubfolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

function backfillPublicTokens_() {
  sheetToObjects_(SHEETS.EVENTS).forEach(function (row) {
    if (!String(row.publicToken || "").trim()) {
      updateEventField_(String(row.eventId), "publicToken", token_());
    }
  });
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

function installMavashEvents() {
  const result = installMavashEvents_();
  Logger.log(JSON.stringify(result));
  return result;
}

// ─── Tenant / Owner (SaaS) ───────────────────────────────────────────────────

function requireInternal_(body) {
  var expected = PropertiesService.getScriptProperties().getProperty("INTERNAL_API_SECRET");
  if (!expected || String(body.internalSecret || "") !== String(expected)) {
    throw new Error("אין הרשאה");
  }
}

function requireTenant_(body) {
  requireInternal_(body);
  var tenantId = String(body.tenantId || "").trim();
  if (!tenantId) throw new Error("חסר tenantId");
  return tenantId;
}

function getEventRowBySlug_(slug) {
  return sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === String(slug);
  });
}

function requireEventOwnerBySlug_(slug, tenantId) {
  var row = getEventRowBySlug_(slug);
  if (!row) throw new Error("אירוע לא נמצא");
  if (String(row.tenantId || "") !== String(tenantId)) {
    throw new Error("אין הרשאה");
  }
  return mapEventRow_(row);
}

function createUser_(body) {
  requireInternal_(body);
  var email = String(body.email || "").trim().toLowerCase();
  var passwordHash = String(body.passwordHash || "");
  if (!email || !passwordHash) throw new Error("חסר אימייל או סיסמה");
  var existing = sheetToObjects_(SHEETS.USERS).find(function (u) {
    return String(u.email).toLowerCase() === email;
  });
  if (existing) throw new Error("אימייל כבר קיים");
  var userId = uuid_();
  appendRow_(SHEETS.USERS, {
    userId: userId,
    email: email,
    passwordHash: passwordHash,
    plan: "free",
    createdAt: nowIso_(),
  });
  return { userId: userId, email: email, plan: "free" };
}

function getUserByEmail_(body) {
  requireInternal_(body);
  var email = String(body.email || "").trim().toLowerCase();
  var row = sheetToObjects_(SHEETS.USERS).find(function (u) {
    return String(u.email).toLowerCase() === email;
  });
  if (!row) return { user: null };
  return {
    user: {
      userId: String(row.userId),
      email: String(row.email),
      passwordHash: String(row.passwordHash),
      plan: String(row.plan || "free"),
    },
  };
}

function slugify_(text) {
  var base = String(text || "event")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "event").substring(0, 36);
}

function uniqueSlug_(base) {
  var slug = slugify_(base);
  var existing = sheetToObjects_(SHEETS.EVENTS).map(function (e) {
    return String(e.slug);
  });
  if (existing.indexOf(slug) === -1) return slug;
  var i = 2;
  while (existing.indexOf(slug + "-" + i) !== -1) i++;
  return slug + "-" + i;
}

function ownerListEvents_(body) {
  var tenantId = requireTenant_(body);
  var events = sheetToObjects_(SHEETS.EVENTS)
    .filter(function (e) {
      return String(e.tenantId) === String(tenantId);
    })
    .map(mapEventRow_);
  return { events: events };
}

function ownerCreateEvent_(body) {
  var tenantId = requireTenant_(body);
  var name = String(body.name || "").trim();
  if (!name) throw new Error("חסר שם אירוע");
  var eventId = uuid_();
  var slug = body.slug ? slugify_(body.slug) : uniqueSlug_(name);
  if (getEventRowBySlug_(slug)) slug = uniqueSlug_(slug);
  var publicToken = token_();
  var folderId = ensureEventPhotosFolder_(eventId);
  appendRow_(SHEETS.EVENTS, {
    eventId: eventId,
    tenantId: tenantId,
    slug: slug,
    name: name,
    type: String(body.type || "other"),
    date: String(body.date || ""),
    venue: String(body.venue || ""),
    tagline: String(body.tagline || ""),
    themeJson: body.theme
      ? JSON.stringify(body.theme)
      : JSON.stringify({
          primary: "#1e3a5f",
          accent: "#c9a227",
          background: "#faf8f5",
        }),
    driveFolderId: folderId,
    publicToken: publicToken,
    active: "TRUE",
    createdAt: nowIso_(),
  });
  logActivity_(eventId, "", "event_created", { name: name, tenantId: tenantId });
  return { success: true, eventId: eventId, slug: slug, publicToken: publicToken };
}

function computeStats_(eventId) {
  var guests = listGuestsByEventId_(eventId);
  var rsvps = sheetToObjects_(SHEETS.RSVPS).filter(function (r) {
    return String(r.eventId) === String(eventId);
  });
  var confirmed = 0;
  var declined = 0;
  var guestsAttending = 0;
  rsvps.forEach(function (r) {
    if (String(r.attending) === "yes") {
      confirmed++;
      guestsAttending += parseInt(r.guestsCount, 10) || 0;
    } else if (String(r.attending) === "no") {
      declined++;
    }
  });
  var blessingsCount = sheetToObjects_(SHEETS.BLESSINGS).filter(function (b) {
    return String(b.eventId) === String(eventId);
  }).length;
  var photosCount = sheetToObjects_(SHEETS.PHOTOS).filter(function (p) {
    return String(p.eventId) === String(eventId);
  }).length;
  return {
    guestsTotal: guests.length,
    confirmed: confirmed,
    declined: declined,
    pending: Math.max(0, guests.length - rsvps.length),
    guestsAttending: guestsAttending,
    blessingsCount: blessingsCount,
    photosCount: photosCount,
  };
}

function ownerGetStats_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  var event = requireEventOwnerBySlug_(slug, tenantId);
  return { stats: computeStats_(event.eventId) };
}

function ownerListGuests_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return { guests: listGuestsEngagement_(slug) };
}

function ownerListBlessings_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return { blessings: listBlessings_(slug) };
}

function ownerListPhotos_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return { photos: listPhotos_(slug) };
}

function ownerListGuestsEngagement_(body) {
  return ownerListGuests_(body);
}

function ownerListActivity_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return { activity: listActivity_(slug) };
}

function ownerGetRsvps_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return { rsvps: listRsvps_(slug) };
}

function ownerCreateGuest_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return createGuest_(body);
}

function ownerGenerateMemoryBook_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return generateMemoryBook_(slug);
}

function ownerGetMemoryBook_(body) {
  var tenantId = requireTenant_(body);
  var slug = String(body.slug || "");
  requireEventOwnerBySlug_(slug, tenantId);
  return getMemoryBook_(slug);
}

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
  if (!props.getProperty("SITE_BASE_URL")) {
    props.setProperty("SITE_BASE_URL", "https://mavash-events.vercel.app");
  }
  if (!props.getProperty("INTERNAL_API_SECRET")) {
    props.setProperty(
      "INTERNAL_API_SECRET",
      Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "")
    );
  }
  setupWorkbook_();
  installReminderTriggers_();
  const demo = sheetToObjects_(SHEETS.EVENTS).find(function (e) {
    return String(e.slug) === "noam-bar-mitzvah";
  });
  return {
    spreadsheetId: ss.getId(),
    adminAccessKey: props.getProperty("ADMIN_ACCESS_KEY"),
    internalApiSecret: props.getProperty("INTERNAL_API_SECRET"),
    publicToken: demo ? String(demo.publicToken || "") : "",
    slug: "noam-bar-mitzvah",
    eventId: demo ? String(demo.eventId || "") : "",
  };
}

// ─── Sheet utilities ──────────────────────────────────────────────────────────

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    headers.forEach(function (h) {
      ensureColumn_(sheet, h);
    });
  }
  return sheet;
}

function ensureColumn_(sheet, colName) {
  if (!sheet) return;
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (headers.indexOf(colName) === -1) {
    sheet.getRange(1, headers.length + 1).setValue(colName);
  }
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

function jsonResponse_(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function token_() {
  return (
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "").substring(0, 8)
  );
}

function uuid_() {
  return Utilities.getUuid();
}

function nowIso_() {
  return new Date().toISOString();
}

function startOfDay_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("הגדר SPREADSHEET_ID ב-Script Properties");
}
