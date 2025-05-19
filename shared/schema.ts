import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  language: text("language").notNull().default("en"),
  trialStartDate: timestamp("trial_start_date").notNull().defaultNow(),
  subscribed: boolean("subscribed").notNull().default(false),
});

// Session table for express-session
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const radarReports = pgTable("radar_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().default(1),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  location: text("location").default(""),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
  verified: boolean("verified").notNull().default(false),
  verifiedCount: integer("verified_count").notNull().default(1),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  language: true,
}).extend({
  language: z.string().default('no')
});

export const insertRadarReportSchema = createInsertSchema(radarReports).pick({
  userId: true,
  latitude: true,
  longitude: true,
  location: true,
}).extend({
  // Ensure these fields are properly typed with defaults
  location: z.string().nullable().default(''),
  userId: z.number().default(1)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRadarReport = z.infer<typeof insertRadarReportSchema>;
export type RadarReport = typeof radarReports.$inferSelect;

// Extended schemas for client validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const reportSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  location: z.string().optional(),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type ReportRequest = z.infer<typeof reportSchema>;
