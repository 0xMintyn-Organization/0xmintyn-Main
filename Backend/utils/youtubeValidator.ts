// utils/youtubeValidator.ts

/**
 * Validates if a string is a valid YouTube URL or video ID
 * Supports various YouTube URL formats
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmedUrl = url.trim();

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  const watchPattern = /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?vi=)([a-zA-Z0-9_-]{11})/;
  if (watchPattern.test(trimmedUrl)) return true;

  // Pattern 2: youtu.be/VIDEO_ID
  const shortPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  if (shortPattern.test(trimmedUrl)) return true;

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedPattern = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
  if (embedPattern.test(trimmedUrl)) return true;

  // Pattern 4: youtube.com/v/VIDEO_ID
  const vPattern = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/;
  if (vPattern.test(trimmedUrl)) return true;

  // Pattern 5: Just the video ID (11 characters)
  const idPattern = /^([a-zA-Z0-9_-]{11})$/;
  if (idPattern.test(trimmedUrl)) return true;

  return false;
}

/**
 * Extracts YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmedUrl = url.trim();

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  const watchPattern = /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?vi=)([a-zA-Z0-9_-]{11})/;
  const watchMatch = trimmedUrl.match(watchPattern);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Pattern 2: youtu.be/VIDEO_ID
  const shortPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const shortMatch = trimmedUrl.match(shortPattern);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedPattern = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
  const embedMatch = trimmedUrl.match(embedPattern);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Pattern 4: youtube.com/v/VIDEO_ID
  const vPattern = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/;
  const vMatch = trimmedUrl.match(vPattern);
  if (vMatch && vMatch[1]) return vMatch[1];

  // Pattern 5: Just the video ID (11 characters)
  const idPattern = /^([a-zA-Z0-9_-]{11})$/;
  const idMatch = trimmedUrl.match(idPattern);
  if (idMatch && idMatch[1]) return idMatch[1];

  return null;
}

/**
 * Validates course data structure and YouTube URLs
 */
export function validateCourseData(courseData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(courseData)) {
    errors.push("Course data must be an array of sections");
    return { valid: false, errors };
  }

  for (let sectionIndex = 0; sectionIndex < courseData.length; sectionIndex++) {
    const section = courseData[sectionIndex];

    if (!section || typeof section !== 'object') {
      errors.push(`Section ${sectionIndex + 1} is invalid`);
      continue;
    }

    if (!section.videos || !Array.isArray(section.videos)) {
      errors.push(`Section ${sectionIndex + 1} must have a videos array`);
      continue;
    }

    for (let videoIndex = 0; videoIndex < section.videos.length; videoIndex++) {
      const video = section.videos[videoIndex];

      if (!video || typeof video !== 'object') {
        errors.push(`Section ${sectionIndex + 1}, Video ${videoIndex + 1} is invalid`);
        continue;
      }

      if (!video.videoUrl || typeof video.videoUrl !== 'string') {
        errors.push(`Section ${sectionIndex + 1}, Video ${videoIndex + 1} must have a videoUrl string`);
        continue;
      }

      if (!isValidYouTubeUrl(video.videoUrl)) {
        errors.push(`Section ${sectionIndex + 1}, Video ${videoIndex + 1} has an invalid YouTube URL: ${video.videoUrl}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
