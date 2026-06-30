"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Send } from "lucide-react";
import {
  markFlowComplete,
  submitBlessing,
  submitRsvp,
  trackGuestOpen,
  uploadPhotos,
} from "@/services/api";
import type { EventInfo, FlowContext, GuestSession } from "@/types/mvp";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";
import { FLOW_STEP_IMAGE } from "@/lib/event-images";
import { EventStepNav } from "@/components/EventStepNav";
import { StepImage } from "@/components/StepImage";

type Step = "rsvp" | "thanks" | "blessing" | "photos" | "done";

const SESSION_KEY = "mavash-guest-session";

function saveSession(key: string, session: GuestSession) {
  sessionStorage.setItem(key, JSON.stringify(session));
}

function sessionKey(ctx: FlowContext) {
  return ctx.mode === "guest"
    ? `${SESSION_KEY}:${ctx.eventId}:${ctx.guestId}`
    : `${SESSION_KEY}:${ctx.slug}`;
}

export function EventFlow({
  event,
  ctx,
  initialName = "",
  initialPhone = "",
  hasRsvp = false,
  initialAttending,
}: {
  event: EventInfo;
  ctx: FlowContext;
  initialName?: string;
  initialPhone?: string;
  hasRsvp?: boolean;
  initialAttending?: "yes" | "no";
}) {
  const tracked = useRef(false);
  const [step, setStep] = useState<Step>(hasRsvp ? "thanks" : "rsvp");
  const [session, setSession] = useState<GuestSession | null>(
    hasRsvp && ctx.mode === "guest"
      ? {
          guestId: ctx.guestId,
          rsvpId: "",
          name: initialName,
          attending: initialAttending || "yes",
        }
      : null
  );
  const [error, setError] = useState("");

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [attending, setAttending] = useState<"yes" | "no" | "">(
    initialAttending || ""
  );
  const [guestsCount, setGuestsCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [blessing, setBlessing] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");
  const [navHint, setNavHint] = useState("");

  const primary = event.theme?.primary || "#1e3a5f";
  const accent = event.theme?.accent || "#c9a227";

  const activeGuestId =
    session?.guestId || (ctx.mode === "guest" ? ctx.guestId : "");

  const canUseGuestSteps = Boolean(activeGuestId);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey(ctx));
      if (!raw) return;
      const saved = JSON.parse(raw) as GuestSession;
      if (!saved.guestId) return;
      setSession(saved);
      if (saved.name) setName(saved.name);
      if (saved.attending) setAttending(saved.attending);
    } catch {
      /* ignore */
    }
  }, [ctx]);

  useEffect(() => {
    if (ctx.mode !== "guest" || tracked.current) return;
    tracked.current = true;
    trackGuestOpen(ctx.eventId, ctx.guestId).catch(() => {});
  }, [ctx]);

  useEffect(() => {
    if (step !== "thanks") return;
    const t = setTimeout(() => setStep("blessing"), 3500);
    return () => clearTimeout(t);
  }, [step]);

  function goToStep(target: "rsvp" | "blessing" | "photos") {
    setNavHint("");
    if (target !== "rsvp" && !canUseGuestSteps) {
      setNavHint("קודם מאשרים הגעה (שלב אישור הגעה)");
      setStep("rsvp");
      return;
    }
    setStep(target);
  }

  async function onRsvpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !attending) {
      setError("נא למלא שם ולבחור אם מגיעים");
      return;
    }
    setLoading(true);
    try {
      const result = await submitRsvp(ctx, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        attending,
        guestsCount: attending === "yes" ? guestsCount : 0,
        notes: notes.trim() || undefined,
      });
      const guestSession: GuestSession = {
        guestId: result.guestId,
        rsvpId: result.rsvpId,
        name: name.trim(),
        attending,
      };
      setSession(guestSession);
      saveSession(sessionKey(ctx), guestSession);
      setStep("thanks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  async function onBlessingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGuestId) {
      setError("קודם מאשרים הגעה");
      setStep("rsvp");
      return;
    }
    if (!blessing.trim()) return;
    setLoading(true);
    setError("");
    try {
      await submitBlessing(ctx, blessing.trim(), activeGuestId);
      setStep("photos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...picked].slice(0, UPLOAD_LIMITS.maxFilesPerBatch));
    e.target.value = "";
  }

  async function finishFlow() {
    await markFlowComplete(ctx, activeGuestId).catch(() => {});
    setStep("done");
  }

  async function onUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGuestId || !files.length) {
      setError("בחרו לפחות תמונה אחת");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await uploadPhotos(ctx, activeGuestId, files, (done, total) => {
        setUploadProgress(`מעלה ${done}/${total}`);
      });
      await finishFlow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  }

  const displayName = session?.name || initialName || name;

  return (
    <div className="space-y-4">
      <EventStepNav
        step={step}
        canUseGuestSteps={canUseGuestSteps}
        accent={accent}
        onSelect={goToStep}
      />
      {navHint && <p className="text-center text-sm text-amber-700">{navHint}</p>}

      <div className="flex gap-1 px-1">
        {(["rsvp", "thanks", "blessing", "photos"] as const).map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              background:
                ["rsvp", "thanks", "blessing", "photos", "done"].indexOf(step) >= i
                  ? accent
                  : "rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>

      {step === "rsvp" && (
        <form onSubmit={onRsvpSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <StepImage src={FLOW_STEP_IMAGE.rsvp} alt="אישור הגעה" priority />
          <h2 className="font-heading text-xl">
            {initialName ? `שלום, ${initialName.split(" ")[0]}!` : "אישור הגעה"}
          </h2>
          {initialName && (
            <p className="text-sm text-charcoal/60">נשמח לדעת אם תגיעו לאירוע</p>
          )}

          <label className="block">
            <span className="text-sm text-charcoal/60">שם מלא *</span>
            <input
              required
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3.5 text-base outline-none focus:border-gold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
            />
          </label>

          <div>
            <span className="text-sm text-charcoal/60">האם תגיעו? *</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  ["yes", "כן, נגיע ✓"],
                  ["no", "לא נוכל"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAttending(val)}
                  className={`min-h-[52px] rounded-xl border-2 py-3 text-base font-medium transition ${
                    attending === val
                      ? val === "yes"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-charcoal/30 bg-charcoal/5"
                      : "border-charcoal/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {attending === "yes" && (
            <label className="block">
              <span className="text-sm text-charcoal/60">כמה אורחים (כולל אתכם)?</span>
              <input
                type="number"
                min={1}
                max={20}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3.5 text-base"
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value, 10) || 1)}
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm text-charcoal/60">הערה (אופציונלי)</span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 text-base"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="אלרגיות, כיסא לתינוק..."
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] rounded-full py-3.5 text-base font-medium text-white disabled:opacity-60"
            style={{ background: primary }}
          >
            {loading ? "שולח..." : "שליחה"}
          </button>
        </form>
      )}

      {step === "thanks" && (
        <div className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm">
          <StepImage src={FLOW_STEP_IMAGE.thanks} alt="תודה" />
          <p className="text-5xl">🎉</p>
          <h2 className="font-heading text-2xl">תודה{displayName ? `, ${displayName}` : ""}!</h2>
          <p className="text-charcoal/70">
            {session?.attending === "no"
              ? "תודה שעדכנתם. אפשר גם לשלוח ברכה או תמונות למשפחה."
              : hasRsvp
                ? "שמחנו לראות אתכם! המשיכו לברכה ותמונות."
                : "קיבלנו את אישור ההגעה. המשיכו לברכה ותמונות!"}
          </p>
          <p className="text-xs text-charcoal/40">ממשיכים לברכה בעוד רגע… או לחצו למטה</p>
          <button
            type="button"
            onClick={() => setStep("blessing")}
            className="mt-2 w-full min-h-[48px] rounded-full py-3 text-sm font-medium text-white"
            style={{ background: primary }}
          >
            המשך עכשיו
          </button>
        </div>
      )}

      {step === "blessing" && (
        <form onSubmit={onBlessingSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <StepImage src={FLOW_STEP_IMAGE.blessing} alt="ברכה" />
          <h2 className="font-heading text-xl">
            ברכה{displayName ? ` ל${displayName.split(" ")[0]}` : ""}
          </h2>
          <p className="text-sm text-charcoal/60">אופציונלי — אפשר לדלג</p>

          <textarea
            rows={5}
            className="w-full rounded-xl border border-charcoal/15 px-4 py-3 text-base outline-none focus:border-gold"
            value={blessing}
            onChange={(e) => setBlessing(e.target.value)}
            placeholder="מזל טוב! מאחלים לך..."
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-2">
            {blessing.trim() ? (
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-full py-3.5 text-base font-medium text-white disabled:opacity-60"
                style={{ background: primary }}
              >
                <Send className="h-5 w-5" />
                {loading ? "שולח..." : "שליחת ברכה והמשך"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setStep("photos")}
              className="min-h-[48px] rounded-full border border-charcoal/15 py-3 text-sm text-charcoal/70"
            >
              דילוג לתמונות →
            </button>
          </div>
        </form>
      )}

      {step === "photos" && (
        <form onSubmit={onUploadSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <StepImage src={FLOW_STEP_IMAGE.photos} alt="העלאת תמונות" />
          <h2 className="font-heading text-xl">שיתוף תמונות</h2>
          <p className="text-sm text-charcoal/60">
            עד {UPLOAD_LIMITS.maxFilesPerBatch} תמונות · דחיסה אוטומטית
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={onPickPhotos}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-charcoal/20 py-12 text-charcoal/60 active:border-gold"
          >
            <Camera className="h-10 w-10" />
            <span className="text-base">צילום או בחירה מהגלריה</span>
            <span className="text-xs">
              {files.length}/{UPLOAD_LIMITS.maxFilesPerBatch} נבחרו
            </span>
          </button>

          {files.length > 0 && (
            <p className="text-center text-sm text-charcoal/50">
              <ImagePlus className="mb-1 inline h-4 w-4" /> {files.length} תמונות מוכנות
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {uploadProgress && <p className="text-sm text-charcoal/50">{uploadProgress}</p>}

          <div className="flex flex-col gap-2">
            {files.length > 0 && (
              <button
                type="submit"
                disabled={loading}
                className="min-h-[52px] rounded-full py-3.5 text-base font-medium text-white disabled:opacity-60"
                style={{ background: primary }}
              >
                {loading ? "מעלה..." : `העלאת ${files.length} תמונות`}
              </button>
            )}
            <button
              type="button"
              onClick={finishFlow}
              className="min-h-[48px] rounded-full border border-charcoal/15 py-3 text-sm text-charcoal/70"
            >
              סיום בלי תמונות
            </button>
          </div>
        </form>
      )}

      {step === "done" && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <StepImage src={FLOW_STEP_IMAGE.done} alt="סיום" />
          <p className="text-5xl">✨</p>
          <h2 className="mt-4 font-heading text-2xl">תודה רבה!</h2>
          <p className="mt-2 text-charcoal/70">הכל נשמר. נתראה באירוע!</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setStep("blessing")}
              className="min-h-[44px] rounded-full border border-charcoal/15 py-2.5 text-sm text-charcoal/70"
            >
              שליחת ברכה נוספת
            </button>
            <button
              type="button"
              onClick={() => setStep("photos")}
              className="min-h-[44px] rounded-full border border-charcoal/15 py-2.5 text-sm text-charcoal/70"
            >
              העלאת תמונות
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
