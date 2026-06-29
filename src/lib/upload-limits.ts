/** Client-side upload guard rails — keeps GAS/Drive payloads small. */
export const UPLOAD_LIMITS = {
  maxFilesPerBatch: 50,
  maxBatchSize: 10,
  /** Reject before compression */
  maxFileBytesBefore: 15 * 1024 * 1024,
  /** Target after compression */
  maxFileBytesAfter: 2 * 1024 * 1024,
  maxDimensionPx: 1920,
  jpegQuality: 0.82,
} as const;
