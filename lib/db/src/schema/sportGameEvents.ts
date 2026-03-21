import { pgTable, serial, text, integer, real, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Universal Game Event Table ───────────────────────────────────────────────
// Every sport reduces to: Participants + Arena + Clock + Events
// This is the core of the sports operating system

export const sportGameEvents = pgTable(
  "sport_game_events",
  {
    id:          serial("id").primaryKey(),
    gameId:      text("game_id").notNull(),
    league:      text("league").notNull(),
    eventType:   text("event_type").notNull(),
    period:      text("period"),
    clock:       text("clock"),
    teamId:      text("team_id"),
    teamName:    text("team_name"),
    athleteId:   text("athlete_id"),
    athleteName: text("athlete_name"),
    description: text("description").notNull(),
    scoreHome:   integer("score_home"),
    scoreAway:   integer("score_away"),
    xCoord:      real("x_coord"),
    yCoord:      real("y_coord"),
    metadata:    jsonb("metadata"),
    espnEventId: text("espn_event_id"),
    recordedAt:  timestamp("recorded_at").defaultNow().notNull(),
  },
  (t) => [
    index("sport_game_events_game_id_idx").on(t.gameId),
    index("sport_game_events_league_idx").on(t.league),
    index("sport_game_events_recorded_at_idx").on(t.recordedAt),
    unique("sport_game_events_espn_event_id_uq").on(t.espnEventId),
  ]
);

export const insertSportGameEventSchema = createInsertSchema(sportGameEvents).omit({ id: true, recordedAt: true });
export type InsertSportGameEvent = z.infer<typeof insertSportGameEventSchema>;
export type SportGameEvent = typeof sportGameEvents.$inferSelect;

// ─── Game State Snapshot ──────────────────────────────────────────────────────
// Live snapshot updated after every event ingestion

export const sportGameStates = pgTable(
  "sport_game_states",
  {
    id:            serial("id").primaryKey(),
    gameId:        text("game_id").notNull().unique(),
    league:        text("league").notNull(),
    status:        text("status").notNull(),
    homeTeam:      text("home_team").notNull(),
    awayTeam:      text("away_team").notNull(),
    homeTeamLogo:  text("home_team_logo"),
    awayTeamLogo:  text("away_team_logo"),
    scoreHome:     integer("score_home").default(0),
    scoreAway:     integer("score_away").default(0),
    period:        text("period"),
    clock:         text("clock"),
    possession:    text("possession"),
    venue:         text("venue"),
    startTime:     text("start_time"),
    derivedStats:  jsonb("derived_stats"),
    winProbHome:   real("win_prob_home"),
    momentumScore: real("momentum_score"),
    updatedAt:     timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("sport_game_states_game_id_idx").on(t.gameId),
    index("sport_game_states_league_idx").on(t.league),
    index("sport_game_states_status_idx").on(t.status),
  ]
);

export const insertSportGameStateSchema = createInsertSchema(sportGameStates).omit({ id: true, updatedAt: true });
export type InsertSportGameState = z.infer<typeof insertSportGameStateSchema>;
export type SportGameState = typeof sportGameStates.$inferSelect;
