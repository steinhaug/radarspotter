import fs from 'fs';
import path from 'path';

/**
 * Dependencies check
 * Verifies that all required dependencies are installed and available
 */

export function checkDependencies() {
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
        console.error(`   Try running 'npm install' to install missing dependencies.`);
        allDepsInstalled = false;
        continue;
      }
      
      console.log(`✓ Dependency '${dep}' is installed.`);
    }
    
    if (allDepsInstalled) {
      console.log(`✓ All required dependencies are installed.`);
    }
    
    return allDepsInstalled;
  } catch (error: any) {
    console.error('❌ Error checking dependencies:', error.message);
    return false;
  }
}