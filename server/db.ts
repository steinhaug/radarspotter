import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database connection
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Helper functions for database operations
export async function createTablesIfNotExist() {
  try {
    // Check if the tables exist and create them if they don't
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        trial_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        subscribed BOOLEAN NOT NULL DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS radar_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        location TEXT,
        reported_at TIMESTAMP NOT NULL DEFAULT NOW(),
        active BOOLEAN NOT NULL DEFAULT TRUE,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        verified_count INTEGER NOT NULL DEFAULT 1
      );
    `);
    
    console.log("Database tables created or verified successfully");
  } catch (error) {
    console.error("Error creating database tables:", error);
    throw error;
  }
}