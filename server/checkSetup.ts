import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Check setup utility for radar application
 * This script tests:
 * 1. Database connection
 * 2. Node.js installation
 * 3. Database availability 
 * 4. Dependencies installation
 */

console.log('🔍 Starting system setup check...\n');

// 1. Check Database Connection
async function checkDatabaseConnection() {
  console.log('📊 Checking database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    return false;
  }
  
  console.log('✓ DATABASE_URL environment variable is set.');
  
  let pool: Pool | null = null;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT 1 as connection_test');
    if (result && result.rows && result.rows[0].connection_test === 1) {
      console.log('✓ Successfully connected to the database.');
      return true;
    } else {
      console.error('❌ Could not verify database connection.');
      return false;
    }
  } catch (error: any) {
    if (error.message && error.message.includes('authentication')) {
      console.error('❌ Database authentication failed. Check your credentials.');
    } else if (error.message && error.message.includes('connect')) {
      console.error('❌ Could not connect to the database. The database might be unavailable.');
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

// 2. Check Node.js Installation
function checkNodeInstallation() {
  console.log('\n🟢 Checking Node.js installation...');
  
  try {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version').toString().trim();
    
    console.log(`✓ Node.js version: ${nodeVersion}`);
    console.log(`✓ npm version: ${npmVersion}`);
    
    const versionNumber = nodeVersion.slice(1).split('.').map(Number);
    if (versionNumber[0] < 16) {
      console.warn('⚠️ Warning: This application works best with Node.js v16 or higher.');
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Error checking Node.js installation:', error.message);
    return false;
  }
}

// 3. Check Database Availability
async function checkDatabaseAvailability() {
  console.log('\n🗃️ Checking database functionality...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Cannot check database availability without DATABASE_URL.');
    return false;
  }
  
  let pool: Pool | null = null;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Try to check if users table exists and is accessible
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (result && result.rows && result.rows[0].exists) {
      // If the table exists, try counting rows
      const countResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`✓ Database is available and users table exists with ${countResult.rows[0].count} users.`);
      return true;
    } else {
      console.error('❌ The users table does not exist in the database.');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error checking database availability:', error.message);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// 4. Check Dependencies
function checkDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json not found.');
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const requiredDeps = [
      'express',
      '@neondatabase/serverless',
      'react',
      'drizzle-orm',
      'mapbox-gl'
    ];
    
    let allDepsInstalled = true;
    
    for (const dep of requiredDeps) {
      if (!dependencies[dep]) {
        console.error(`❌ Required dependency '${dep}' is not listed in package.json.`);
        allDepsInstalled = false;
        continue;
      }
      
      // Check if the dependency is actually installed in node_modules
      const depPath = path.join(process.cwd(), 'node_modules', dep);
      if (!fs.existsSync(depPath)) {
        console.error(`❌ Dependency '${dep}' is listed in package.json but not installed.`);
        allDepsInstalled = false;
        continue;
      }
      
      console.log(`✓ Dependency '${dep}' is installed.`);
    }
    
    return allDepsInstalled;
  } catch (error: any) {
    console.error('❌ Error checking dependencies:', error.message);
    return false;
  }
}

// Run all checks
async function runAllChecks() {
  const dbConnected = await checkDatabaseConnection();
  const nodeInstalled = checkNodeInstallation();
  const dbAvailable = await checkDatabaseAvailability();
  const depsInstalled = checkDependencies();
  
  console.log('\n📋 Setup Check Summary:');
  console.log(`Database Connection: ${dbConnected ? '✅' : '❌'}`);
  console.log(`Node.js Installation: ${nodeInstalled ? '✅' : '❌'}`);
  console.log(`Database Availability: ${dbAvailable ? '✅' : '❌'}`);
  console.log(`Dependencies: ${depsInstalled ? '✅' : '❌'}`);
  
  if (dbConnected && nodeInstalled && dbAvailable && depsInstalled) {
    console.log('\n🎉 All systems are ready! Your setup looks good to go.');
  } else {
    console.log('\n⚠️ Some checks failed. Please review the issues above before proceeding.');
  }
}

// Execute the checks
runAllChecks().catch(error => {
  console.error('Error during setup check:', error);
  process.exit(1);
});