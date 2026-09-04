/**
 * Video Utilities for MS Shorts VIP
 * Handles clean stream resolution, instant frame capture thumbnails, and video playback safety
 */

export const BULLETPROOF_SAMPLE_VIDEOS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://vjs.zencdn.net/v/oceans.mp4',
  '/uploads/flower.mp4',
  '/uploads/sample1.mp4',
  '/uploads/bunny.mp4',
  '/uploads/action.mp4',
];

export function getCleanVideoUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return BULLETPROOF_SAMPLE_VIDEOS[0];
  }
  const trimmed = url.trim();

  // Blob and data URLs (user recorded videos or instant optimistic uploads)
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Check if running in offline APK file:// wrapper or null origin
  const isLocalOrApk =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' ||
      window.location.origin === 'null' ||
      !window.location.origin.startsWith('http'));

  if (isLocalOrApk) {
    if (trimmed.includes('flower.mp4')) return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
    if (trimmed.includes('bunny.mp4')) return 'https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4';
    if (trimmed.includes('sample1.mp4')) return 'https://media.w3.org/2010/05/bunny/trailer.mp4';
    if (trimmed.includes('action.mp4')) return 'https://vjs.zencdn.net/v/oceans.mp4';
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `https://ais-pre-zxavhz74ojcsuwirvfwhcc-631878896873.asia-southeast1.run.app${cleanPath}`;
    }
  }

  // Uploaded backend uploads
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Replace dead Google Cloud Storage sample videos that return HTTP 403
  if (trimmed.includes('commondatastorage.googleapis.com/gtv-videos-bucket/sample/')) {
    if (trimmed.includes('BigBuckBunny')) return 'https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4';
    if (trimmed.includes('ForBiggerBlazes')) return 'https://media.w3.org/2010/05/bunny/trailer.mp4';
    if (trimmed.includes('ElephantsDream')) return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
    if (trimmed.includes('WeAreGoingOnBullrun')) return 'https://vjs.zencdn.net/v/oceans.mp4';
    if (trimmed.includes('ForBiggerEscapes')) return 'https://media.w3.org/2010/05/bunny/trailer.mp4';
    return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  }

  // Replace dead non-existent archive.org dummy download links with local working videos
  if (trimmed.includes('archive.org/download/ms-shorts-vip-') || trimmed.includes('archive.org/download/undefined')) {
    return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  }

  // Handle archive.org details link -> direct download MP4 stream
  if (trimmed.includes('archive.org/details/')) {
    const identifier = trimmed.split('archive.org/details/')[1]?.split('/')[0]?.split('?')[0]?.trim();
    if (identifier && !identifier.startsWith('@')) {
      return `https://archive.org/download/${identifier}/${identifier}.mp4`;
    }
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
