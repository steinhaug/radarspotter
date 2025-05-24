/**
 * System setup checker for radar application
 * 
 * This script runs a series of tests to verify the proper setup
 * of the application environment and database.
 */

import { checkDatabaseConnection } from './tests/databaseConnection';
import { checkNodeInstallation } from './tests/systemCheck';
import { checkDatabasePrerequisites } from './tests/databasePrerequisites';

console.log('🔍 Starting system setup check...\n');

// Run all checks
async function runAllChecks() {
  // Run tests in sequence with numbering
  console.log('Test #1: Database Connection');
  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    console.log('Suksess!\n');
  }
  
  console.log('Test #2: Node.js Installation');
  const { success: nodeInstalled, lowMemory } = await checkNodeInstallation();
  if (nodeInstalled) {
    console.log(`Suksess!${lowMemory ? ' (Low memory!)' : ''}\n`);
  }
  
  console.log('Test #3: Database Functionality');
  const dbFunctional = await checkDatabasePrerequisites(dbConnected);
  if (dbFunctional) {
    console.log('Suksess!\n');
  }
  
  // Generate concise summary report
  console.log('\n📋 Setup Check Summary:');
  console.log(`#1 Database Connection: ${dbConnected ? '✅' : '❌'}`);
  console.log(`#2 Node.js Installation: ${nodeInstalled ? '✅' : '❌'}`);
  console.log(`#3 Database Functionality: ${dbFunctional ? '✅' : '❌'}`);
  
  if (dbConnected && nodeInstalled && dbFunctional) {
    console.log('\n🎉 Alt klart! Systemet er korrekt konfigurert og klart til bruk.');
    return true;
  } else {
    console.log('\n⚠️ Noen tester feilet. Vennligst gå gjennom feilene ovenfor før du fortsetter.');
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