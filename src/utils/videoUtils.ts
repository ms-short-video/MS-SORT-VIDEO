/**
 * Video Utilities for MS Shorts VIP
 * Handles clean stream resolution, instant frame capture thumbnails, and video playback safety
 */

export const CLOUD_SERVER_ORIGIN = 'https://ais-pre-zxavhz74ojcsuwirvfwhcc-631878896873.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin.startsWith('http') && !origin.includes('localhost:') && !origin.includes('file:')) {
      return origin;
    }
  }
  return CLOUD_SERVER_ORIGIN;
}

export const BULLETPROOF_SAMPLE_VIDEOS: string[] = [];

export function getCleanVideoUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }
  const trimmed = url.trim();

  // Blob and data URLs (user recorded videos or instant optimistic uploads on same device)
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Preserve and resolve user-uploaded videos from /uploads/ directory to absolute HTTPS stream
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${getApiBaseUrl()}${cleanPath}`;
  }

  // Google Drive share link -> direct stream link
  if (trimmed.includes('drive.google.com/file/d/')) {
    const fileId = trimmed.split('/d/')[1]?.split('/')[0]?.split('?')[0];
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  } else if (trimmed.includes('drive.google.com/open?id=')) {
    const fileId = trimmed.split('id=')[1]?.split('&')[0];
    if (fileId) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // Dropbox direct link
  if (trimmed.includes('dropbox.com') && !trimmed.includes('raw=1')) {
    return trimmed.includes('?') ? `${trimmed}&raw=1` : `${trimmed}?raw=1`;
  }

  // Direct HTTPS/HTTP streams
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Download Video File directly to local storage / gallery
 */
export async function downloadVideoFile(
  videoUrl: string,
  fileName: string = 'MS_Shorts_VIP_Video.mp4',
  onProgress?: (percent: number) => void
): Promise<boolean> {
  try {
    const cleanUrl = getCleanVideoUrl(videoUrl);

    // If it's a blob/data URL, trigger direct anchor download
    if (cleanUrl.startsWith('blob:') || cleanUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = cleanUrl;
      a.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onProgress?.(100);
      return true;
    }

    onProgress?.(15);
    // Fetch with blob conversion for reliable browser file saving
    const res = await fetch(cleanUrl);
    if (!res.ok) throw new Error('Fetch failed with status ' + res.status);
    onProgress?.(50);
    const blob = await res.blob();
    onProgress?.(85);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    onProgress?.(100);
    return true;
  } catch (err) {
    console.warn('Direct blob fetch failed, falling back to direct anchor download:', err);
    // Fallback: direct anchor link with download attribute
    const cleanUrl = getCleanVideoUrl(videoUrl);
    const a = document.createElement('a');
    a.href = cleanUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onProgress?.(100);
    return true;
  }
}

/**
 * Generate an instant video thumbnail from a File, Blob, or video URL.
 * Uses an offscreen HTML5 Video element and Canvas to capture the first keyframe at 0.5s.
 */
export function generateVideoThumbnail(source: File | Blob | string): Promise<string> {
  return new Promise((resolve) => {
    let videoUrl = '';
    let isCreatedUrl = false;

    if (typeof source === 'string') {
      videoUrl = source;
    } else if (source && typeof source === 'object') {
      try {
        videoUrl = URL.createObjectURL(source as Blob);
        isCreatedUrl = true;
      } catch {
        resolve('');
        return;
      }
    } else {
      resolve('');
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    let resolved = false;
    const cleanup = () => {
      if (isCreatedUrl && videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      video.removeAttribute('src');
      video.load();
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve('');
      }
    }, 4000);

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      } catch {
        // seek error fallback
      }
    };

    video.onseeked = () => {
      if (resolved) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 360;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Canvas thumbnail capture notice:', err);
      }
      resolved = true;
      clearTimeout(timeout);
      cleanup();
      resolve('');
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve('');
      }
    };

    video.src = videoUrl;
  });
}
