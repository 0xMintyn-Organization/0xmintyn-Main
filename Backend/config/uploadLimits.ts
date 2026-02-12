/**
 * Single source of truth for file upload size limits (50MB everywhere).
 * If you get 413 "Content Too Large" for uploads under 50MB, the reverse proxy
 * (e.g. Nginx) is rejecting the request. See nginx-upload-limit.conf in repo root.
 */
export const MAX_FILE_UPLOAD_MB = 50;
export const MAX_FILE_UPLOAD_BYTES = MAX_FILE_UPLOAD_MB * 1024 * 1024;
