import type { GameData, IdPresetInfo } from "../config/types.ts";

const GAMEDATA_CACHE = new Map<string, { data: GameData; timestamp: number }>();
let TOP3TRENDING_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;
let TOP3NEWEST_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;

const GAMEDATA_CACHE_DUR = 86400 * 1000; // 24 hours
const MAX_GAMEDATA_CACHE_SIZE = 500; //500 game cache limit
const TOP3TRENDING_CACHE_DUR = 86400 * 1000 * 2; // 48 hours
const TOP3NEWEST_CACHE_DUR = 43200 * 1000; // 12 hours

// clean up caches every six hours
setInterval(() => {
    const now = Date.now();

    //GAMEDATA cache cleaning
    for (const [key, value] of GAMEDATA_CACHE.entries()) {
        if (now - value.timestamp > GAMEDATA_CACHE_DUR) {
            GAMEDATA_CACHE.delete(key);
        }
    }

    //TOP3MOSTLIKED cleaning
    if (TOP3TRENDING_CACHE && now - TOP3TRENDING_CACHE.timestamp > TOP3TRENDING_CACHE_DUR) {
        TOP3TRENDING_CACHE = null;
    }

    //TOP3MOSTRECENT cleaning
    if (TOP3NEWEST_CACHE && now - TOP3NEWEST_CACHE.timestamp > TOP3NEWEST_CACHE_DUR) {
        TOP3NEWEST_CACHE = null;
    }
}, 21600000);

//GAMEDATA_CACHE helpers
export function getCachedGameData(gameId: string): GameData | null {
    const cached = GAMEDATA_CACHE.get(gameId);
    if (cached && Date.now() - cached.timestamp < GAMEDATA_CACHE_DUR) {
        return cached.data;
    }
    return null;
}

export function setGameDataCache(gameId: string, data: GameData): void {
    // Delete and re-add to move to end (most recent)
    GAMEDATA_CACHE.delete(gameId);
    GAMEDATA_CACHE.set(gameId, { data, timestamp: Date.now() });

    // Evict oldest if over limit
    if (GAMEDATA_CACHE.size > MAX_GAMEDATA_CACHE_SIZE) {
        const firstKey = GAMEDATA_CACHE.keys().next().value ?? "";
        GAMEDATA_CACHE.delete(firstKey);
    }
}

export function delGameDataCache(gameId: string): void {
    GAMEDATA_CACHE.delete(gameId);
}

// TOP3MOSTLIKED_CACHE helpers
export function getCachedTop3Trending(): IdPresetInfo[] | null {
    if (TOP3TRENDING_CACHE && Date.now() - TOP3TRENDING_CACHE.timestamp < TOP3TRENDING_CACHE_DUR) {
        return TOP3TRENDING_CACHE.data;
    }
    return null;
}

export function insertTop3NewestCache(newGame: IdPresetInfo): void {
    if (!TOP3NEWEST_CACHE) return;

    const updatedData = [newGame, ...TOP3NEWEST_CACHE.data.slice(0, 2)];
    TOP3NEWEST_CACHE = { data: updatedData, timestamp: Date.now() };
}

export function setTop3TrendingCache(data: IdPresetInfo[]): void {
    TOP3TRENDING_CACHE = { data, timestamp: Date.now() };
}

export function delTop3TrendingCache(): void {
    TOP3TRENDING_CACHE = null;
}

// TOP3NEWEST_CACHE helpers
export function getCachedTop3Newest(): IdPresetInfo[] | null {
    if (TOP3NEWEST_CACHE && Date.now() - TOP3NEWEST_CACHE.timestamp < TOP3NEWEST_CACHE_DUR) {
        return TOP3NEWEST_CACHE.data;
    }
    return null;
}

export function setTop3NewestCache(data: IdPresetInfo[]): void {
    TOP3NEWEST_CACHE = { data, timestamp: Date.now() };
}

export function delTop3NewestCache(): void {
    TOP3NEWEST_CACHE = null;
}

/*
 * Any cached data related to gameId is deleted
 */
export function invalidateInAllCaches(gameId: string): void {
    //invalidate gameData cache
    delGameDataCache(gameId);

    //if game in trending cache, invalidate cache
    const top3Trending: IdPresetInfo[] | null = getCachedTop3Trending();
    if (top3Trending?.some((game) => game.id === gameId)) {
        delTop3TrendingCache();
    }

    //if game in most recent cache, invalidate cache
    const top3MostRecent: IdPresetInfo[] | null = getCachedTop3Newest();
    if (top3MostRecent?.some((game) => game.id === gameId)) {
        delTop3NewestCache();
    }
}
