import { AuthUser, VideoReel } from '../types';

/**
 * Single source of truth for MS Shorts VIP Authorization & Ownership
 */
export const ADMIN_EMAILS: string[] = [
  'mehndibabu84@gmail.com',
  'admin@mshorts.vip',
  'admin@msshorts.vip',
];

/**
 * Securely verify if the current user is an administrator
 */
export function isUserAdmin(user: AuthUser | null): boolean {
  if (!user || !user.isLoggedIn) return false;
  const email = (user.email || '').toLowerCase().trim();
  if (email && ADMIN_EMAILS.includes(email)) return true;
  if (user.isAdmin === true && email.includes('admin')) return true;
  return false;
}

/**
 * Securely verify if the user has permission to delete this reel.
 * Rules:
 * 1. Admin can delete any user's reel.
 * 2. Authenticated user can delete ONLY their own reel.
 * 3. Guest / other users CANNOT delete.
 */
export function canUserDeleteReel(reel: VideoReel, user: AuthUser | null): boolean {
  if (!user || !user.isLoggedIn) return false;

  // 1. Admin permission
  if (isUserAdmin(user)) return true;

  // 2. Verified owner UID match
  const ownerUid = reel.ownerUid || reel.uploaderId;
  if (ownerUid && user.uid && ownerUid === user.uid) {
    return true;
  }

  // 3. Verified uploader email match
  const userEmail = (user.email || '').toLowerCase().trim();
  const uploaderEmail = (reel.uploaderEmail || '').toLowerCase().trim();
  if (uploaderEmail && userEmail && uploaderEmail === userEmail) {
    return true;
  }

  // 4. Safe legacy verification (for legacy videos created before ownerUid was introduced):
  // Check exact username match only if ownerUid and uploaderEmail were not set on the reel
  if (!ownerUid && !uploaderEmail) {
    const reelUsername = (reel.username || '').toLowerCase().replace('@', '').trim();
    const currentUsername = (user.username || '').toLowerCase().replace('@', '').trim();
    if (reelUsername && currentUsername && reelUsername === currentUsername) {
      return true;
    }
  }

  return false;
}
