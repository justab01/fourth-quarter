import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull().default("Sports Fan"),
  favoriteTeams: jsonb("favorite_teams").$type<string[]>().notNull().default([]),
  favoriteLeagues: jsonb("favorite_leagues").$type<string[]>().notNull().default([]),
  favoritePlayers: jsonb("favorite_players").$type<string[]>().notNull().default([]),
  rivals: jsonb("rivals").$type<string[]>().notNull().default([]),
  darkMode: boolean("dark_mode").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
