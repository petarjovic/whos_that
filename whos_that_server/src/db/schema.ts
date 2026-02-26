// Drizzle schema for non-auth related parts of database
// Source of truth for database
import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    unique,
    date,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.ts";
import { sql } from "drizzle-orm";

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

export const gameItems = pgTable(
    "game_items",
    {
        id: text("id").primaryKey(),
        gameId: text("game_id")
            .notNull()
            .references(() => games.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        orderIndex: integer("order_index").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [unique().on(table.gameId, table.orderIndex)]
);

export const gameLikes = pgTable(
    "game_likes",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        gameId: text("game_id")
            .notNull()
            .references(() => games.id, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [unique().on(table.gameId, table.userId)]
);

export const feedback = pgTable("feedback", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    type: text("type", { enum: ["Bug", "FeatureReq", "Other"] }).notNull(),
    message: text("message").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    url: text("url"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailies = pgTable("dailies", {
    id: text("id").primaryKey(),
    ogGameId: text("og_game_id").references(() => games.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    characterContext: text("character_context").notNull(),
    scheduledDate: date("scheduled_date").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const dailyGameItems = pgTable(
    "daily_game_items",
    {
        id: text("id").primaryKey(),
        dailyId: text("daily_id")
            .notNull()
            .references(() => dailies.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        orderIndex: integer("order_index").notNull(),
        isWinner: boolean("is_winner").notNull().default(false),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        unique().on(table.dailyId, table.orderIndex),
        // Partial unique index: only one winner per daily
        uniqueIndex()
            .on(table.dailyId)
            .where(sql`${table.isWinner} = true`),
    ]
);
