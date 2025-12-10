import type { IdPresetInfo } from "../config/types.ts";

const GAMEDATA_CACHE = new Map<string, { data: any; timestamp: number }>();
let TOP3MOSTLIKED_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;
let TOP3MOSTRECENT_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;

const GAMEDATA_CACHE_DUR = 86400 * 1000; // 24 hours
const MAX_GAMEDATA_CACHE_SIZE = 500; //500 game cache limit
const TOP3MOSTLIKED_CACHE_DUR = 86400 * 1000 * 2; // 48 hours
const TOP3MOSTRECENT_CACHE_DUR = 43200 * 1000; // 12 hours

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
    if (TOP3MOSTLIKED_CACHE && now - TOP3MOSTLIKED_CACHE.timestamp > TOP3MOSTLIKED_CACHE_DUR) {
        TOP3MOSTLIKED_CACHE = null;
    }

    //TOP3MOSTRECENT cleaning
    if (TOP3MOSTRECENT_CACHE && now - TOP3MOSTRECENT_CACHE.timestamp > TOP3MOSTRECENT_CACHE_DUR) {
        TOP3MOSTRECENT_CACHE = null;
    }
}, 21600000);

//GAMEDATA_CACHE helpers
export function getCachedGameData(gameId: string): any | null {
    const cached = GAMEDATA_CACHE.get(gameId);
    if (cached && Date.now() - cached.timestamp < GAMEDATA_CACHE_DUR) {
        return cached.data;
    }
    return null;
}

export function setGameDataCache(gameId: string, data: any): void {
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
export function getCachedTop3MostLiked(): IdPresetInfo[] | null {
    if (
        TOP3MOSTLIKED_CACHE &&
        Date.now() - TOP3MOSTLIKED_CACHE.timestamp < TOP3MOSTLIKED_CACHE_DUR
    ) {
        return TOP3MOSTLIKED_CACHE.data;
    }
    return null;
}

export function insertTop3MostRecentCache(newGame: IdPresetInfo): void {
    if (!TOP3MOSTRECENT_CACHE) return;

    const updatedData = [newGame, ...TOP3MOSTRECENT_CACHE.data.slice(0, 2)];
    TOP3MOSTRECENT_CACHE = { data: updatedData, timestamp: Date.now() };
}

export function setTop3MostLikedCache(data: any): void {
    TOP3MOSTLIKED_CACHE = { data, timestamp: Date.now() };
}

export function delTop3MostLikedCache(): void {
    TOP3MOSTLIKED_CACHE = null;
}

// TOP3MOSTRECENT_CACHE helpers
export function getCachedTop3MostRecent(): IdPresetInfo[] | null {
    if (
        TOP3MOSTRECENT_CACHE &&
        Date.now() - TOP3MOSTRECENT_CACHE.timestamp < TOP3MOSTRECENT_CACHE_DUR
    ) {
        return TOP3MOSTRECENT_CACHE.data;
    }
    return null;
}

export function setTop3MostRecentCache(data: any): void {
    TOP3MOSTRECENT_CACHE = { data, timestamp: Date.now() };
}

export function delTop3MostRecentCache(): void {
    TOP3MOSTRECENT_CACHE = null;
}

/*
 * Any cached data related to gameId is deleted
 */
export function invalidateInAllCaches(gameId: string): void {
    //invalidate gameData cache
    delGameDataCache(gameId);

    //if game in most liked cache, invalidate cache
    const top3MostLiked: IdPresetInfo[] | null = getCachedTop3MostLiked();
    if (top3MostLiked?.some((game) => game.id === gameId)) {
        delTop3MostLikedCache();
    }

    //if game in most recent cache, invalidate cache
    const top3MostRecent: IdPresetInfo[] | null = getCachedTop3MostRecent();
    if (top3MostRecent?.some((game) => game.id === gameId)) {
        delTop3MostRecentCache();
    }
}
