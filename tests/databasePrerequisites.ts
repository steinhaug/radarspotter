import { Pool } from '@neondatabase/serverless';

/**
 * Database prerequisites test
 * Checks if the database contains the required tables and schema
 */

export async function checkDatabasePrerequisites(dbConnectionSuccessful: boolean) {
  console.log('\n🗃️ Checking database functionality...');
  
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
    const existingTables: string[] = [];
    let allTablesExist = true;
    
    // Check each table individually and report status
    for (const tableName of requiredTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result && result.rows && result.rows[0].exists) {
        existingTables.push(tableName);
        
        // Get table row count
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`✓ Table '${tableName}' exists with ${countResult.rows[0].count} rows.`);
      } else {
        console.error(`❌ Required table '${tableName}' does not exist in the database.`);
        allTablesExist = false;
      }
    }
    
    // Check database version
    try {
      const versionResult = await pool.query('SELECT version();');
      console.log(`✓ Database version: ${versionResult.rows[0].version.split(',')[0]}`);
    } catch (error) {
      console.warn('⚠️ Could not check database version.');
    }
    
    if (allTablesExist) {
      console.log(`✓ All required database tables exist.`);
    } else {
      console.warn(`⚠️ Some required tables are missing. The application may not function correctly.`);
    }
    
    return allTablesExist;
  } catch (error: any) {
    console.error('❌ Error checking database functionality:', error.message);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}