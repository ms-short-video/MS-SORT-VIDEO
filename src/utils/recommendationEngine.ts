import { VideoReel, ReelCategory, FeedCategoryFilter, UserTasteProfile } from '../types';

const STORAGE_KEY = 'ms_shorts_user_taste_profile';

export const DEFAULT_TASTE_PROFILE: UserTasteProfile = {
  music: 50,
  comedy: 40,
  dance: 35,
  vlog: 25,
  viral: 30,
  shayari: 20,
  action: 25,
  tech: 15,
  totalWatchTimeSeconds: 0,
  totalReelsWatched: 0,
  favoriteCategory: 'music',
  lastUpdated: Date.now(),
};

/**
 * Load user taste profile from localStorage or default
 */
export function getSavedTasteProfile(): UserTasteProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_TASTE_PROFILE, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_TASTE_PROFILE;
}

/**
 * Save user taste profile to localStorage
 */
export function saveTasteProfile(profile: UserTasteProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

/**
 * Determine category from reel object (fallbacks based on hashtags & caption)
 */
export function inferReelCategory(reel: VideoReel): ReelCategory {
  if (reel.category) return reel.category;

  const text = `${reel.caption} ${reel.songName} ${reel.hashtags?.join(' ')}`.toLowerCase();

  if (text.includes('comedy') || text.includes('funny') || text.includes('joke') || text.includes('meme') || text.includes('haso') || text.includes('prank')) {
    return 'comedy';
  }
  if (text.includes('song') || text.includes('music') || text.includes('gana') || text.includes('audio') || text.includes('beats') || text.includes('singer') || text.includes('dj')) {
    return 'music';
  }
  if (text.includes('dance') || text.includes('nach') || text.includes('choreography') || text.includes('thumka')) {
    return 'dance';
  }
  if (text.includes('shayari') || text.includes('love') || text.includes('romantic') || text.includes('pyar') || text.includes('sad') || text.includes('ishq') || text.includes('poetry')) {
    return 'shayari';
  }
  if (text.includes('action') || text.includes('stunt') || text.includes('fight') || text.includes('car') || text.includes('speed') || text.includes('bullrun')) {
    return 'action';
  }
  if (text.includes('vlog') || text.includes('travel') || text.includes('daily') || text.includes('food') || text.includes('lifestyle')) {
    return 'vlog';
  }
  if (text.includes('tech') || text.includes('phone') || text.includes('ai') || text.includes('gadget') || text.includes('coding')) {
    return 'tech';
  }

  return 'viral';
}

/**
 * Record a user's watch session and interactions on a video
 * Updates category affinity score dynamically based on duration and engagement.
 */
export function recordWatchInteraction(
  reel: VideoReel,
  watchSeconds: number,
  interactions: {
    isLiked?: boolean;
    isShared?: boolean;
    isCommented?: boolean;
    isSoundUsed?: boolean;
    isLooped?: boolean;
    isFollowed?: boolean;
  } = {}
): { updatedProfile: UserTasteProfile; boostedCategory: ReelCategory; deltaScore: number } {
  const currentProfile = getSavedTasteProfile();
  const category = inferReelCategory(reel);

  let delta = 0;

  // Fast skip penalty (< 2.5s) vs Extended watch bonus
  if (watchSeconds < 2.0 && !interactions.isLiked && !interactions.isShared) {
    delta -= 3; // Slight penalty for quickly skipped category
  } else if (watchSeconds >= 2.0 && watchSeconds < 5.0) {
    delta += 4;
  } else if (watchSeconds >= 5.0 && watchSeconds < 12.0) {
    delta += 10;
  } else if (watchSeconds >= 12.0) {
    delta += 20; // Watched nearly full video or multiple seconds
  }

  // Bonus for looping / replaying video
  if (interactions.isLooped) {
    delta += 15;
  }

  // Explicit positive engagement signals
  if (interactions.isLiked) delta += 18;
  if (interactions.isCommented) delta += 12;
  if (interactions.isShared) delta += 22;
  if (interactions.isSoundUsed) delta += 30;
  if (interactions.isFollowed) delta += 20;

  // Update specific category weight (bound between 5 and 300)
  const newCategoryScore = Math.max(5, Math.min(300, (currentProfile[category] || 30) + delta));

  const updatedProfile: UserTasteProfile = {
    ...currentProfile,
    [category]: newCategoryScore,
    totalWatchTimeSeconds: currentProfile.totalWatchTimeSeconds + Math.round(watchSeconds),
    totalReelsWatched: currentProfile.totalReelsWatched + 1,
    lastUpdated: Date.now(),
    favoriteCategory: determineFavoriteCategory({
      ...currentProfile,
      [category]: newCategoryScore,
    }),
  };

  saveTasteProfile(updatedProfile);

  return {
    updatedProfile,
    boostedCategory: category,
    deltaScore: delta,
  };
}

/**
 * Determine the highest scoring category
 */
function determineFavoriteCategory(profile: UserTasteProfile): ReelCategory {
  const categories: ReelCategory[] = [
    'music',
    'comedy',
    'dance',
    'vlog',
    'viral',
    'shayari',
    'action',
    'tech',
  ];

  let bestCat: ReelCategory = 'music';
  let bestScore = -1;

  for (const cat of categories) {
    const score = profile[cat] || 0;
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  return bestCat;
}

/**
 * Calculate percentage breakdown of user taste for display in UI
 */
export function getTastePercentageBreakdown(profile: UserTasteProfile): Record<ReelCategory, number> {
  const categories: ReelCategory[] = [
    'music',
    'comedy',
    'dance',
    'vlog',
    'viral',
    'shayari',
    'action',
    'tech',
  ];

  const total = categories.reduce((sum, cat) => sum + Math.max(5, profile[cat] || 10), 0);

  const result = {} as Record<ReelCategory, number>;
  for (const cat of categories) {
    const val = Math.max(5, profile[cat] || 10);
    result[cat] = Math.round((val / total) * 100);
  }

  return result;
}

/**
 * Manually boost a category score (e.g. from user tapping "Focus on Music" or "Focus on Comedy")
 */
export function manuallyBoostCategory(category: ReelCategory, boostAmount: number = 60): UserTasteProfile {
  const current = getSavedTasteProfile();
  const updated: UserTasteProfile = {
    ...current,
    [category]: (current[category] || 30) + boostAmount,
    favoriteCategory: category,
    lastUpdated: Date.now(),
  };
  saveTasteProfile(updated);
  return updated;
}

/**
 * Reset algorithm recommendations to baseline
 */
export function resetTasteProfile(): UserTasteProfile {
  saveTasteProfile(DEFAULT_TASTE_PROFILE);
  return DEFAULT_TASTE_PROFILE;
}

/**
 * Re-rank and filter video reels based on active category tab & AI user taste profile
 */
export function rankReelsForFeed(
  allReels: VideoReel[],
  categoryFilter: FeedCategoryFilter,
  profile: UserTasteProfile
): VideoReel[] {
  if (!allReels || allReels.length === 0) return [];

  // Filter 1: Following tab
  if (categoryFilter === 'following') {
    const followed = allReels.filter((r) => r.isFollowing);
    return followed.length > 0 ? followed : allReels;
  }

  // Filter 2: Specific category tabs (Music, Comedy, Dance, Shayari, Action, Viral)
  if (categoryFilter !== 'for-you') {
    const filtered = allReels.filter((r) => {
      const cat = inferReelCategory(r);
      return cat === categoryFilter;
    });

    if (filtered.length > 0) {
      // Sort within the category by engagement / VIP status
      return [...filtered].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    // If no reels match exact filter, return all reels
    return allReels;
  }

  // Filter 3: ✨ "For You" (AI Smart Recommendation Mode)
  // Scores every reel based on:
  // 1. User's category affinity weight (highest impact)
  // 2. Creator follow status (+25)
  // 3. User likes (+15)
  // 4. Global reel popularity (log of likes)
  // 5. Exploration jitter (to introduce serendipity and avoid filter bubble)
  const scored = allReels.map((reel, index) => {
    const cat = inferReelCategory(reel);
    const categoryWeight = profile[cat] || 25;

    // Follow affinity
    const followBonus = reel.isFollowing ? 35 : 0;
    // Liked affinity
    const likeBonus = reel.isLiked ? 15 : 0;
    // Popularity factor
    const popularityScore = Math.log10(Math.max(10, reel.likes || 100)) * 5;
    // Small exploration jitter
    const jitter = ((index * 7 + 13) % 11) - 5;

    const totalScore = categoryWeight * 2.2 + followBonus + likeBonus + popularityScore + jitter;

    return {
      reel: {
        ...reel,
        category: cat,
      },
      score: totalScore,
      category: cat,
    };
  });

  // Sort descending by AI score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.reel);
}
