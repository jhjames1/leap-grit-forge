/**
 * Utility functions for handling YouTube videos
 */

/**
 * Converts various YouTube URL formats to embed URLs
 * @param url - The YouTube URL to convert
 * @returns The embed URL or null if not a valid YouTube URL
 */
export function convertToYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  // Handle different YouTube URL formats
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    // youtu.be/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    // youtube.com/embed/VIDEO_ID (already embed format)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    // youtube.com/v/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}

/**
 * Checks if a URL is a YouTube video URL
 * @param url - The URL to check
 * @returns True if it's a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return convertToYouTubeEmbedUrl(url) !== null;
}

/**
 * Extracts video ID from YouTube URL
 * @param url - The YouTube URL
 * @returns The video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
  const embedUrl = convertToYouTubeEmbedUrl(url);
  if (!embedUrl) return null;
  
  const match = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}