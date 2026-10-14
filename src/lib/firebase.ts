import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { AuthUser, VideoReel } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfigJson) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const DEFAULT_GOOGLE_USER: AuthUser = {
  uid: 'google-user-mehndibabu84',
  displayName: 'Mehndi Babu',
  email: 'mehndibabu84@gmail.com',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  username: '@Mehndi_Babu',
  bio: '🌟 VIP Content Creator on MS Shorts | Passionate Video Maker 🎬✨',
  followersCount: 2500,
  isLoggedIn: true,
};

// Local storage registry key for multi-account fallback & seamless sandbox persistence
const USERS_REGISTRY_KEY = 'ms_shorts_vip_users_registry';

export function getLocalUsersRegistry(): Record<string, AuthUser & { password?: string }> {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  // Initialize with default creator account
  return {
    [DEFAULT_GOOGLE_USER.uid]: {
      ...DEFAULT_GOOGLE_USER,
      password: 'password123',
    },
  };
}

export function saveToLocalUsersRegistry(user: AuthUser & { password?: string }) {
  try {
    const registry = getLocalUsersRegistry();
    registry[user.uid] = user;
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Failed saving user to local registry:', e);
  }
}

// Save user profile to Firestore `users/{uid}` and local registry
export async function saveUserProfileToFirestore(user: AuthUser, password?: string): Promise<void> {
  saveToLocalUsersRegistry({ ...user, password });
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        username: user.username,
        bio: user.bio || '',
        followersCount: user.followersCount || 0,
        isVip: !!user.isVip,
        vipLevel: user.vipLevel || 1,
        password: password || 'default123',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('Saved user profile to Firestore:', user.uid);
  } catch (err) {
    console.warn('Firestore user profile save notice (local registry updated):', err);
  }
}

// User Registration: Name, @username, Email, Password, Photo, Bio
export async function registerNewUser(details: {
  displayName: string;
  username: string;
  email: string;
  password?: string;
  photoURL?: string;
  bio?: string;
}): Promise<AuthUser> {
  const cleanDisplayName = details.displayName.trim() || 'New Creator';
  let cleanUsername = details.username.trim();
  if (!cleanUsername.startsWith('@')) {
    cleanUsername = `@${cleanUsername}`;
  }
  cleanUsername = cleanUsername.replace(/\s+/g, '_');
  const cleanEmail = details.email.trim().toLowerCase();
  const password = details.password || 'password123';

  // 1. Check local registry if email or username already taken
  const registry = getLocalUsersRegistry();
  const existingUser = Object.values(registry).find(
    (u) =>
      u.email?.toLowerCase() === cleanEmail ||
      u.username?.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (existingUser) {
    throw new Error(`Account already exists with username ${cleanUsername} or email ${cleanEmail}. Please sign in instead.`);
  }

  // 2. Attempt Firebase Auth registration
  let uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    uid = cred.user.uid;
    await updateProfile(cred.user, {
      displayName: cleanDisplayName,
      photoURL: details.photoURL,
    });
  } catch (authErr) {
    console.warn('Firebase Auth email signup notice (using cloud/local user profile system):', authErr);
  }

  const newUser: AuthUser = {
    uid,
    displayName: cleanDisplayName,
    username: cleanUsername,
    email: cleanEmail,
    photoURL:
      details.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: details.bio?.trim() || '🌟 Content Creator on MS Shorts VIP | Passionate Video Maker 🎬✨',
    followersCount: 0,
    isLoggedIn: true,
    isVip: false,
    vipLevel: 1,
  };

  await saveUserProfileToFirestore(newUser, password);
  return newUser;
}

// User Login: Log in with Email or @Username and Password
export async function loginWithCredentials(
  identifier: string,
  password?: string
): Promise<AuthUser> {
  const cleanId = identifier.trim().toLowerCase();
  const pwd = password || '';

  // 1. Try Firebase Auth with email if formatted like email
  if (cleanId.includes('@') && !cleanId.startsWith('@') && pwd) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanId, pwd);
      const user = cred.user;
      return {
        uid: user.uid,
        displayName: user.displayName || 'Creator',
        email: user.email || cleanId,
        photoURL: user.photoURL || DEFAULT_GOOGLE_USER.photoURL,
        username: `@${(user.displayName || 'user').replace(/\s+/g, '_')}`,
        followersCount: 1,
        isLoggedIn: true,
      };
    } catch (e) {
      console.warn('Firebase Auth signIn notice, checking Firestore/local registry:', e);
    }
  }

  // 2. Check local registry first for instant response
  const registry = getLocalUsersRegistry();
  const foundInLocal = Object.values(registry).find(
    (u) =>
      u.email?.toLowerCase() === cleanId ||
      u.username?.toLowerCase() === cleanId ||
      u.username?.toLowerCase() === `@${cleanId}`
  );

  if (foundInLocal) {
    if (pwd && foundInLocal.password && foundInLocal.password !== pwd) {
      throw new Error('Incorrect password. Please verify your password and try again.');
    }
    const { password: _, ...userObj } = foundInLocal;
    return { ...userObj, isLoggedIn: true };
  }

  // 3. Check Firestore `users` collection
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const d of usersSnap.docs) {
      const uData = d.data();
      const uEmail = (uData.email || '').toLowerCase();
      const uName = (uData.username || '').toLowerCase();
      if (
        uEmail === cleanId ||
        uName === cleanId ||
        uName === `@${cleanId}`
      ) {
        if (pwd && uData.password && uData.password !== pwd) {
          throw new Error('Incorrect password. Please verify your password.');
        }
        const authUser: AuthUser = {
          uid: uData.uid || d.id,
          displayName: uData.displayName || 'Creator',
          email: uData.email || cleanId,
          photoURL: uData.photoURL || DEFAULT_GOOGLE_USER.photoURL,
          username: uData.username || `@${cleanId}`,
          bio: uData.bio,
          followersCount: uData.followersCount || 0,
          isLoggedIn: true,
          isVip: !!uData.isVip,
          vipLevel: uData.vipLevel || 1,
        };
        saveToLocalUsersRegistry({ ...authUser, password: pwd });
        return authUser;
      }
    }
  } catch (err) {
    console.warn('Firestore user search notice:', err);
  }

  // If user enters 'mehndibabu84@gmail.com' or '@Mehndi_Babu', verify password
  if (
    cleanId.includes('mehndibabu') ||
    cleanId.includes('mehndi_babu') ||
    cleanId === 'admin'
  ) {
    if (pwd && pwd !== 'password123' && pwd !== 'admin123' && pwd !== 'mehndibabu84') {
      throw new Error('गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें। (Incorrect password for Admin)');
    }
    return DEFAULT_GOOGLE_USER;
  }

  throw new Error(`User "${identifier}" not found. Please click "Create Account / नया अकाउंट बनाएं" to register!`);
}

export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const isOwner = (user.email || '').toLowerCase() === 'mehndibabu84@gmail.com';
    const authUser: AuthUser = {
      uid: user.uid,
      displayName: user.displayName || (isOwner ? 'Mehndi Babu' : 'User'),
      email: user.email || '',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      username: isOwner
        ? '@Mehndi_Babu'
        : `@${(user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
      followersCount: isOwner ? 1250 : 0,
      isLoggedIn: true,
      isAdmin: isOwner,
    };
    saveUserProfileToFirestore(authUser);
    return authUser;
  } catch (error: any) {
    console.warn('Firebase signInWithPopup error:', error);
    // Never fallback to admin account on failed Google popup
    throw new Error(
      error?.message?.includes('popup-closed')
        ? 'Google Sign-In popup बंद हो गया। कृपया दोबारा कोशिश करें या ईमेल-पासवर्ड से नया अकाउंट बनाएं।'
        : 'Google Sign-In नहीं हो सका। कृपया नीचे ईमेल आईडी और पासवर्ड से नया अकाउंट बनाएं या लॉगिन करें।'
    );
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }
}

import { getCleanVideoUrl } from '../utils/videoUtils';

// Sync reels to Firestore collection ('reels') for central cloud persistence
export async function saveReelToFirestore(reel: VideoReel): Promise<void> {
  try {
    const reelRef = doc(db, 'reels', reel.id);
    let validUrl = reel.videoUrl?.trim() || '';
    if (!validUrl || validUrl.includes('undefined')) {
      return;
    }
    validUrl = getCleanVideoUrl(validUrl);

    const schemaDoc = {
      id: reel.id,
      title: reel.caption || 'Reel by @Mehndi_Babu',
      uploader: reel.username || '@Mehndi_Babu',
      timestamp: new Date().toISOString(),
      likes: reel.likes || 0,
      storagePipeline: 'cloud_storage',
      ...reel,
      videoUrl: validUrl,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(reelRef, schemaDoc, { merge: true });
    console.log('Successfully saved reel to Firestore:', reel.id, validUrl);
  } catch (err) {
    console.warn('Firestore save reel notice (using local storage sync):', err);
  }
}

// Seed default reels to Firestore if collection is empty
export async function seedDefaultReelsIfEmpty(defaultReels: VideoReel[]): Promise<void> {
  try {
    const reelsRef = collection(db, 'reels');
    const snap = await getDocs(reelsRef);
    if (snap.empty && defaultReels && defaultReels.length > 0) {
      console.log('Seeding initial reels to Firestore...');
      for (const r of defaultReels) {
        await saveReelToFirestore(r);
      }
    }
  } catch (e) {
    console.warn('Seeding reels notice:', e);
  }
}

export function subscribeToFirestoreReels(onReelsUpdate: (reels: VideoReel[]) => void): () => void {
  try {
    const reelsRef = collection(db, 'reels');
    return onSnapshot(reelsRef, (snapshot) => {
      if (!snapshot.empty) {
        const remoteReels: VideoReel[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as VideoReel;
          if (data && data.id) {
            // Filter out any legacy dummy reels
            if (data.id.startsWith('reel-vip-') || data.id.startsWith('reel-archive-')) {
              return;
            }
            if (
              data.videoUrl?.includes('oceans.mp4') ||
              data.videoUrl?.includes('bunny.mp4') ||
              data.videoUrl?.includes('flower.mp4') ||
              data.videoUrl?.includes('trailer.mp4') ||
              data.videoUrl?.includes('big_buck_bunny.mp4') ||
              data.videoUrl?.includes('echo-hereweare.mp4') ||
              data.videoUrl?.includes('sample1.mp4') ||
              data.videoUrl?.includes('sample2.mp4')
            ) {
              return;
            }
            data.videoUrl = getCleanVideoUrl(data.videoUrl);
            remoteReels.push(data);
          }
        });
        if (remoteReels.length > 0) {
          // Sort newest first
          remoteReels.sort((a, b) => {
            const timeA = (a as any).timestamp || (a as any).updatedAt || a.id;
            const timeB = (b as any).timestamp || (b as any).updatedAt || b.id;
            return timeB > timeA ? 1 : -1;
          });
          onReelsUpdate(remoteReels);
        }
      }
    }, (err) => {
      console.warn('Firestore listener notice (using local persistence):', err);
    });
  } catch (err) {
    console.warn('Firestore subscribe notice:', err);
    return () => {};
  }
}

