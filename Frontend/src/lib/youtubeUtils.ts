// lib/youtubeUtils.ts

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID&feature=share
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Remove whitespace
  url = url.trim();

  // Pattern 1: youtube.com/watch?v=VIDEO_ID or youtube.com/watch?vi=VIDEO_ID
  const watchPattern = /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?vi=)([a-zA-Z0-9_-]{11})/;
  const watchMatch = url.match(watchPattern);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Pattern 2: youtu.be/VIDEO_ID
  const shortPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const shortMatch = url.match(shortPattern);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedPattern = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
  const embedMatch = url.match(embedPattern);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Pattern 4: youtube.com/v/VIDEO_ID
  const vPattern = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/;
  const vMatch = url.match(vPattern);
  if (vMatch && vMatch[1]) return vMatch[1];

  // Pattern 5: Just the video ID (11 characters)
  const idPattern = /^([a-zA-Z0-9_-]{11})$/;
  const idMatch = url.match(idPattern);
  if (idMatch && idMatch[1]) return idMatch[1];

  return null;
}

/**
 * Validates if a string is a valid YouTube URL or video ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Converts YouTube URL to embed URL
 * Returns: https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Converts YouTube URL to watch URL (standard format)
 * Returns: https://www.youtube.com/watch?v=VIDEO_ID
 */
export function getYouTubeWatchUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Gets YouTube thumbnail URL
 * Returns: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
 */
export function getYouTubeThumbnailUrl(url: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  const qualityMap = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Gets video duration from YouTube (requires API call, but we'll use a placeholder)
 * For now, returns null - duration should be manually entered
 */
export function getYouTubeVideoDuration(url: string): Promise<number | null> {
  // This would require YouTube Data API v3
  // For now, return null and let user enter duration manually
  return Promise.resolve(null);
}
