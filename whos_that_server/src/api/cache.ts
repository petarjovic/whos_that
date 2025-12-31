import { logger } from "../config/logger.ts";
import type { GameData, IdPresetInfo } from "../config/types.ts";

const GAMEDATA_CACHE = new Map<string, { data: GameData; timestamp: number }>();
let TOP3TRENDING_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;
let TOP3NEWEST_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;
let SEARCH_TRENDING_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;
let SEARCH_MOST_LIKED_CACHE: { data: IdPresetInfo[]; timestamp: number } | null = null;

const GAMEDATA_CACHE_DUR = 86400 * 1000 * 5; // 5 Days
const MAX_GAMEDATA_CACHE_SIZE = 500;
const TOP3TRENDING_CACHE_DUR = 64800 * 1000; // 18 hours
const TOP3NEWEST_CACHE_DUR = 43200 * 1000; // 12 hours
const SEARCH_TRENDING_CACHE_DUR = 900 * 1000; // 15 mins
const SEARCH_MOST_LIKED_CACHE_DUR = 1800 * 1000; // 30 mins

// clean up caches every twelve-ish hours
setInterval(() => {
    const now = Date.now();

    //GAMEDATA cache cleaning
    for (const [key, value] of GAMEDATA_CACHE.entries()) {
        if (now - value.timestamp > GAMEDATA_CACHE_DUR) {
            GAMEDATA_CACHE.delete(key);
        }
    }

    //TOP3TRENDING cleaning
    if (TOP3TRENDING_CACHE && now - TOP3TRENDING_CACHE.timestamp > TOP3TRENDING_CACHE_DUR) {
        TOP3TRENDING_CACHE = null;
    }

    //TOP3NEWEST cleaning
    if (TOP3NEWEST_CACHE && now - TOP3NEWEST_CACHE.timestamp > TOP3NEWEST_CACHE_DUR) {
        TOP3NEWEST_CACHE = null;
    }

    // SEARCH_TRENDING cleaning
    if (
        SEARCH_TRENDING_CACHE &&
        now - SEARCH_TRENDING_CACHE.timestamp > SEARCH_TRENDING_CACHE_DUR
    ) {
        SEARCH_TRENDING_CACHE = null;
    }

    // SEARCH_MOST_LIKED cleaning
    if (
        SEARCH_MOST_LIKED_CACHE &&
        now - SEARCH_MOST_LIKED_CACHE.timestamp > SEARCH_MOST_LIKED_CACHE_DUR
    ) {
        SEARCH_MOST_LIKED_CACHE = null;
    }
}, 43200 * 1001);

//GAMEDATA_CACHE helpers
export function getCachedGameData(gameId: string): GameData | null {
    const cached = GAMEDATA_CACHE.get(gameId);
    if (cached && Date.now() - cached.timestamp < GAMEDATA_CACHE_DUR) {
        logger.debug("Got: gamedata cache");
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
    logger.debug("Set: gamedata cache");
}

export function delGameDataCache(gameId: string): void {
    GAMEDATA_CACHE.delete(gameId);
    logger.debug("Deleted: gamedata cache");
}

// TOP3TRENDING_CACHE helpers
export function getCachedTop3Trending(): IdPresetInfo[] | null {
    if (TOP3TRENDING_CACHE && Date.now() - TOP3TRENDING_CACHE.timestamp < TOP3TRENDING_CACHE_DUR) {
        logger.debug("Got: top3-trending cache");
        return TOP3TRENDING_CACHE.data;
    }
    return null;
}

export function insertTop3NewestCache(newGame: IdPresetInfo): void {
    if (!TOP3NEWEST_CACHE) return;

    const updatedData = [newGame, ...TOP3NEWEST_CACHE.data.slice(0, 2)];
    TOP3NEWEST_CACHE = { data: updatedData, timestamp: Date.now() };
    logger.debug("Inserted: top3-newest cache");
}

export function setTop3TrendingCache(data: IdPresetInfo[]): void {
    TOP3TRENDING_CACHE = { data, timestamp: Date.now() };
    logger.debug("Set: top3-trending cache");
}

export function delTop3TrendingCache(): void {
    TOP3TRENDING_CACHE = null;
    logger.debug("Deleted: top3-trending cache");
}

// TOP3NEWEST_CACHE helpers
export function getCachedTop3Newest(): IdPresetInfo[] | null {
    if (TOP3NEWEST_CACHE && Date.now() - TOP3NEWEST_CACHE.timestamp < TOP3NEWEST_CACHE_DUR) {
        logger.debug("Got: top3-newest cache");
        return TOP3NEWEST_CACHE.data;
    }
    return null;
}

export function setTop3NewestCache(data: IdPresetInfo[]): void {
    TOP3NEWEST_CACHE = { data, timestamp: Date.now() };
    logger.debug("Set: top3-newest cache");
}

export function delTop3NewestCache(): void {
    TOP3NEWEST_CACHE = null;
    logger.debug("Deleted: top3-newest cache");
}

// SEARCH_TRENDING_CACHE helpers
export function getCachedSearchTrending(): IdPresetInfo[] | null {
    if (
        SEARCH_TRENDING_CACHE &&
        Date.now() - SEARCH_TRENDING_CACHE.timestamp < SEARCH_TRENDING_CACHE_DUR
    ) {
        logger.debug("Got: search-trending cache");
        return SEARCH_TRENDING_CACHE.data;
    }
    return null;
}

export function setSearchTrendingCache(data: IdPresetInfo[]): void {
    SEARCH_TRENDING_CACHE = { data, timestamp: Date.now() };
    logger.debug("Set: search-trending cache ");
}

export function delSearchTrendingCache(): void {
    SEARCH_TRENDING_CACHE = null;
    logger.debug("Deleted: search-trending cache");
}

// SEARCH_MOST_LIKED_CACHE helpers
export function getCachedSearchMostLiked(): IdPresetInfo[] | null {
    if (
        SEARCH_MOST_LIKED_CACHE &&
        Date.now() - SEARCH_MOST_LIKED_CACHE.timestamp < SEARCH_MOST_LIKED_CACHE_DUR
    ) {
        logger.debug("Got: search-most-liked cache");

        return SEARCH_MOST_LIKED_CACHE.data;
    }
    return null;
}

export function setSearchMostLikedCache(data: IdPresetInfo[]): void {
    SEARCH_MOST_LIKED_CACHE = { data, timestamp: Date.now() };
    logger.debug("Set: search-most-liked cache");
}

export function delSearchMostLikedCache(): void {
    SEARCH_MOST_LIKED_CACHE = null;
    logger.debug("Deleted: search-most-liked cache");
}

/*
 * Any cached data related to gameId is deleted
 */
export function invalidateInAllCaches(gameId: string): void {
    logger.debug("Invalidating all caches for gameId: " + gameId);
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

    //if game in trending cache, invalidate cache
    const searchTrending = getCachedSearchTrending();
    if (searchTrending?.some((game) => game.id === gameId)) {
        delSearchTrendingCache();
    }

    //if game in most liked cache, invalidate cache
    const searchMostLiked = getCachedSearchMostLiked();
    if (searchMostLiked?.some((game) => game.id === gameId)) {
        delSearchMostLikedCache();
    }
}

export function updateLikeCountInCaches(gameId: string, increment: boolean): void {
    logger.debug(
        "Updating like count in caches for gameId: " +
            gameId +
            " increment: " +
            increment.toString()
    );
    // Update in trending cache
    const top3Trending = getCachedTop3Trending();
    if (top3Trending) {
        let delCache = false; //del cache if removing like causes 0 likes

        for (const game of top3Trending) {
            if (game.id !== gameId) continue;

            if (!increment && game.numLikes - 1 <= 0) {
                delCache = true;
            } else {
                game.numLikes = increment ? game.numLikes + 1 : game.numLikes - 1;
            }
        }

        if (delCache) delTop3TrendingCache();
        else setTop3TrendingCache(top3Trending);
    }

    // Update in newest cache
    const top3Newest = getCachedTop3Newest();
    if (top3Newest) {
        const updated = top3Newest.map((game) =>
            game.id === gameId
                ? {
                      ...game,
                      numLikes: increment ? game.numLikes + 1 : Math.max(0, game.numLikes - 1),
                  }
                : game
        );
        setTop3NewestCache(updated);
    }

    // Update in trending cache
    const searchTrending = getCachedSearchTrending();
    if (searchTrending) {
        let delCache = false;
        for (const game of searchTrending) {
            if (game.id !== gameId) continue;
            if (!increment && game.numLikes - 1 <= 0) {
                delCache = true;
            } else {
                game.numLikes = increment ? game.numLikes + 1 : game.numLikes - 1;
            }
        }
        if (delCache) delSearchTrendingCache();
        else setSearchTrendingCache(searchTrending);
    }

    // Update in most liked search cache
    const searchMostLiked = getCachedSearchMostLiked();
    if (searchMostLiked) {
        const updated = searchMostLiked.map((game) =>
            game.id === gameId
                ? {
                      ...game,
                      numLikes: increment ? game.numLikes + 1 : Math.max(0, game.numLikes - 1),
                  }
                : game
        );
        setSearchMostLikedCache(updated);
    }
}
