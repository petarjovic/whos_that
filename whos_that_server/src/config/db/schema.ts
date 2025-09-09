import { pgTable, integer, varchar, jsonb } from "drizzle-orm/pg-core";

export const games = pgTable("games", {
    gameId: integer("game_id").primaryKey().generatedAlwaysAsIdentity({
        name: "games_game_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 2147483647,
        cache: 1,
    }),
    gameName: varchar("game_name", { length: 20 }).notNull(),
    assets: jsonb(),
});
