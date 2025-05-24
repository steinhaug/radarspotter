import { execSync } from 'child_process';

/**
 * System check
 * Verifies Node.js installation and version
 */

export function checkNodeInstallation() {
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
    
    // Check system memory
    try {
      const memoryInfo = execSync('node -e "console.log(JSON.stringify(process.memoryUsage()))"').toString();
      const memoryUsage = JSON.parse(memoryInfo);
      const availableMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      
      console.log(`✓ Available heap memory: ${availableMemoryMB} MB`);
      
      if (availableMemoryMB < 200) {
        console.warn('⚠️ Warning: Low available memory. The application may experience performance issues.');
      }
    } catch (error) {
      console.warn('⚠️ Could not check system memory.');
    }
    
    // Check for TypeScript
    try {
      const typescriptVersion = execSync('npx tsc --version').toString().trim();
      console.log(`✓ TypeScript: ${typescriptVersion}`);
    } catch (error) {
      console.warn('⚠️ TypeScript is not installed or not in PATH.');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Error checking Node.js installation:', error.message);
    return false;
  }
}