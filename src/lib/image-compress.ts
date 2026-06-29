import { UPLOAD_LIMITS } from "./upload-limits";

export type CompressedImage = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
};

/**
 * Resize + JPEG compress in the browser before sending to Apps Script.
 * Reduces Drive quota usage and avoids GAS 6-minute timeouts on bulk uploads.
 */
export async function compressImageForUpload(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" אינו קובץ תמונה`);
  }
  if (file.size > UPLOAD_LIMITS.maxFileBytesBefore) {
    throw new Error(
      `"${file.name}" גדול מדי (מקס ${Math.round(UPLOAD_LIMITS.maxFileBytesBefore / 1024 / 1024)}MB לפני דחיסה)`
    );
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    UPLOAD_LIMITS.maxDimensionPx / Math.max(bitmap.width, bitmap.height)
  );
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("לא ניתן לדחוס תמונה");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = UPLOAD_LIMITS.jpegQuality;
  let blob = await canvasToJpeg(canvas, quality);

  while (blob.size > UPLOAD_LIMITS.maxFileBytesAfter && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToJpeg(canvas, quality);
  }

  if (blob.size > UPLOAD_LIMITS.maxFileBytesAfter) {
    throw new Error(`"${file.name}" עדיין גדול מדי אחרי דחיסה — נסו תמונה קטנה יותר`);
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  const out = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });

  return {
    file: out,
    originalBytes: file.size,
    compressedBytes: out.size,
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("דחיסה נכשלה"))),
      "image/jpeg",
      quality
    );
  });
}

export async function compressImagesForUpload(files: File[]): Promise<CompressedImage[]> {
  if (files.length > UPLOAD_LIMITS.maxFilesPerBatch) {
    throw new Error(`מקסימום ${UPLOAD_LIMITS.maxFilesPerBatch} תמונות בבת אחת`);
  }
  return Promise.all(files.map(compressImageForUpload));
}
