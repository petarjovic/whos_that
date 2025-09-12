import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.ts";

export const games = pgTable("games", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(false).notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const gameItems = pgTable("game_items", {
    id: text("id").primaryKey(),
    gameId: text("game_id")
        .notNull()
        .references(() => games.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    name: text("name").notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameLikes = pgTable("game_likes", {
    id: text("id").primaryKey(),
    gameId: text("game_id")
        .notNull()
        .references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
