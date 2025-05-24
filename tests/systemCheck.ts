import { execSync } from 'child_process';

/**
 * System check
 * Verifies Node.js installation and version
 */

export async function checkNodeInstallation(): Promise<{ success: boolean; lowMemory: boolean }> {
  console.log('\n🟢 Checking Node.js installation...');
  let lowMemory = false;
  
  try {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version').toString().trim();
    
    // Only show detailed info if there are issues
    const versionNumber = nodeVersion.slice(1).split('.').map(Number);
    if (versionNumber[0] < 16) {
      console.warn('❌ This application requires Node.js v16 or higher.');
      console.warn(`   Current version: ${nodeVersion}`);
      return { success: false, lowMemory };
    }
    
    // Check system memory
    try {
      const memoryInfo = execSync('node -e "console.log(JSON.stringify(process.memoryUsage()))"').toString();
      const memoryUsage = JSON.parse(memoryInfo);
      const availableMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      
      if (availableMemoryMB < 200) {
        console.log('Low memory!');
        lowMemory = true;
      }
    } catch (error) {
      // Silently continue if memory check fails
    }
    
    // Verify TypeScript is available (silently)
    try {
      execSync('npx tsc --version', { stdio: 'ignore' });
    } catch (error) {
      console.warn('❌ TypeScript is not installed or not in PATH.');
      return { success: false, lowMemory };
    }
    
    return { success: true, lowMemory };
  } catch (error: any) {
    console.error('❌ Error checking Node.js installation:', error.message);
    return { success: false, lowMemory };
  }
}