"use client";

import { useRef, useState } from "react";
import { uploadPhotos } from "@/lib/events-api";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";
import { ImagePlus } from "lucide-react";

export function PhotoUpload({ slug, accessToken }: { slug: string; accessToken: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedBy, setUploadedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    const images = picked.filter((f) => f.type.startsWith("image/"));
    const tooBig = images.find((f) => f.size > UPLOAD_LIMITS.maxFileBytesBefore);
    if (tooBig) {
      setError(`"${tooBig.name}" גדול מדי לפני דחיסה`);
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...images].slice(0, UPLOAD_LIMITS.maxFilesPerBatch));
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setError("בחרו לפחות תמונה אחת");
      return;
    }
    setError("");
    setLoading(true);
    setProgress("מדחס תמונות...");
    try {
      await uploadPhotos(slug, files, accessToken, uploadedBy.trim() || undefined, (done, total) => {
        setProgress(`מעלה ${done}/${total}`);
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">📸</p>
        <h2 className="mt-4 font-heading text-2xl">תודה!</h2>
        <p className="mt-2 text-charcoal/70">{files.length} תמונות הועלו בהצלחה.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl">שיתוף תמונות</h2>
      <p className="text-sm text-charcoal/60">
        עד {UPLOAD_LIMITS.maxFilesPerBatch} תמונות — דחיסה אוטומטית לפני העלאה (חוסך quota).
      </p>

      <label className="block">
        <span className="text-sm text-charcoal/60">השם שלכם (אופציונלי)</span>
        <input
          className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-3 outline-none focus:border-gold"
          value={uploadedBy}
          onChange={(e) => setUploadedBy(e.target.value)}
        />
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-charcoal/20 py-10 text-charcoal/60 transition hover:border-gold hover:text-charcoal"
      >
        <ImagePlus className="h-10 w-10" />
        <span>לחצו לבחירת תמונות</span>
        <span className="text-xs">
          {files.length}/{UPLOAD_LIMITS.maxFilesPerBatch} נבחרו
        </span>
      </button>

      {files.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-charcoal/70">
          {files.map((f) => (
            <li key={f.name + f.size} className="truncate">
              {f.name}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {progress && <p className="text-sm text-charcoal/50">{progress}</p>}

      <button
        type="submit"
        disabled={loading || !files.length}
        className="w-full rounded-full bg-charcoal py-3 font-medium text-cream disabled:opacity-60"
      >
        {loading ? "מעלה..." : `העלאת ${files.length} תמונות`}
      </button>
    </form>
  );
}
