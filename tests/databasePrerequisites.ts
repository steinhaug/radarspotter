import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon database connection
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

/**
 * Database prerequisites test
 * Checks if the database contains the required tables and schema
 */

export async function checkDatabasePrerequisites(dbConnectionSuccessful: boolean) {
  // Skip this test if database connection failed
  if (!dbConnectionSuccessful) {
    console.log('⚠️ Skipping database functionality check because database connection failed.');
    return false;
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Cannot check database functionality without DATABASE_URL.');
    return false;
  }
  
  let pool: Pool | null = null;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check for required tables
    const requiredTables = ['users', 'radar_reports', 'sessions', 'achievements', 'user_achievements'];
    let allTablesExist = true;
    
    // Check each table individually but only report failures
    for (const tableName of requiredTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (!(result && result.rows && result.rows[0].exists)) {
        console.error(`❌ Required table '${tableName}' does not exist in the database.`);
        allTablesExist = false;
      }
    }
    
    if (!allTablesExist) {
      console.warn(`⚠️ Some required tables are missing. The application may not function correctly.`);
      return false;
    }
    
    // Check if test user exists, create if not
    const testUserResult = await pool.query(`
      SELECT * FROM users WHERE username = $1
    `, ['test']);
    
    if (testUserResult.rowCount === 0) {
      console.log('Creating test user (username: test, password: test)...');
      
      // Insert test user
      await pool.query(`
        INSERT INTO users (username, password, email, language, trial_start_date, subscribed) 
        VALUES ($1, $2, $3, $4, NOW(), $5)
      `, ['test', 'test', 'test@test.com', 'no', false]);
      
      console.log('✓ Test user created successfully.');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Error checking database functionality:', error.message);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}