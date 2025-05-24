import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon database connection
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

/**
 * Database connection test
 * Checks if the database connection can be established
 */

export async function checkDatabaseConnection() {
  // 1. Check if credentials exist
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    return false;
  }
  
  // 2. Validate credential format
  const databaseUrl = process.env.DATABASE_URL;
  
  // Extract components from the connection string
  try {
    const url = new URL(databaseUrl);
    const username = url.username;
    const password = url.password;
    
    // Check if credentials are valid (at least 2 characters)
    if (username.length < 2) {
      console.error('❌ Database username is too short (less than 2 characters).');
      return false;
    }
    
    if (password.length < 2) {
      console.error('❌ Database password is too short (less than 2 characters).');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format. Expected format: postgres://username:password@host:port/database');
    return false;
  }
  
  // 3. Attempt actual connection
  let pool: Pool | null = null;
  try {
    pool = new Pool({ connectionString: databaseUrl });
    const result = await pool.query('SELECT 1 as connection_test');
    
    if (result && result.rows && result.rows[0].connection_test === 1) {
      return true;
    } else {
      console.error('❌ Could not verify database connection.');
      return false;
    }
  } catch (error: any) {
    // 3.1 Handle different error cases
    if (error.message && error.message.includes('authentication')) {
      console.error('❌ Database authentication failed. Check your credentials.');
      console.error(`   Error details: ${error.message}`);
    } else if (error.message && (error.message.includes('connect') || error.message.includes('timeout'))) {
      // Extract connection details for better error reporting
      try {
        const url = new URL(databaseUrl);
        console.error(`❌ Could not connect to the database at ${url.hostname}:${url.port || '5432'}.`);
        console.error('   The database might be unavailable or blocked by a firewall.');
        console.error(`   Error details: ${error.message}`);
      } catch {
        console.error('❌ Could not connect to the database. The database might be unavailable.');
        console.error(`   Error details: ${error.message}`);
      }
    } else {
      console.error('❌ Database connection error:', error.message);
    }
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}