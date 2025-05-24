/**
 * System setup checker for radar application
 * 
 * This script runs a series of tests to verify the proper setup
 * of the application environment, dependencies, and database.
 */

import { checkDatabaseConnection } from './tests/databaseConnection';
import { checkDependencies } from './tests/dependencies';
import { checkNodeInstallation } from './tests/systemCheck';
import { checkDatabasePrerequisites } from './tests/databasePrerequisites';

console.log('🔍 Starting system setup check...\n');

// Run all checks
async function runAllChecks() {
  // Run tests in sequence
  const dbConnected = await checkDatabaseConnection();
  const nodeInstalled = checkNodeInstallation();
  const dbFunctional = await checkDatabasePrerequisites(dbConnected);
  const depsInstalled = checkDependencies();
  
  // Generate summary report
  console.log('\n📋 Setup Check Summary:');
  console.log(`Database Connection: ${dbConnected ? '✅' : '❌'}`);
  console.log(`Node.js Installation: ${nodeInstalled ? '✅' : '❌'}`);
  console.log(`Database Functionality: ${dbFunctional ? '✅' : '❌'}`);
  console.log(`Dependencies: ${depsInstalled ? '✅' : '❌'}`);
  
  if (dbConnected && nodeInstalled && dbFunctional && depsInstalled) {
    console.log('\n🎉 All systems are ready! Your setup looks good to go.');
    return true;
  } else {
    console.log('\n⚠️ Some checks failed. Please review the issues above before proceeding.');
    return false;
  }
}

// Execute the checks
runAllChecks()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error during setup check:', error);
    process.exit(1);
  });