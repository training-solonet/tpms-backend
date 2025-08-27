const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Helper function to run command with retry
const runCommandWithRetry = (command, args, options = {}, maxRetries = 3) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const tryCommand = () => {
      attempts++;
      log(`🔄 Attempt ${attempts}/${maxRetries}: ${command} ${args.join(' ')}`, 'cyan');
      
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          log(`✅ Command succeeded on attempt ${attempts}`, 'green');
          resolve();
        } else if (attempts < maxRetries) {
          log(`⚠️ Attempt ${attempts} failed (code ${code}), retrying in 2 seconds...`, 'yellow');
          setTimeout(tryCommand, 2000);
        } else {
          log(`❌ Command failed after ${attempts} attempts`, 'red');
          reject(new Error(`Command failed after ${maxRetries} attempts with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        if (attempts < maxRetries) {
          log(`⚠️ Attempt ${attempts} error: ${error.message}, retrying...`, 'yellow');
          setTimeout(tryCommand, 2000);
        } else {
          reject(error);
        }
      });
    };
    
    tryCommand();
  });
};

// Check if processes are using Prisma files
const checkProcesses = async () => {
  log('🔍 Checking for processes using Prisma files...', 'yellow');
  
  try {
    // On Windows, check for node processes
    if (process.platform === 'win32') {
      await runCommandWithRetry('tasklist', ['/fi', 'imagename eq node.exe'], {}, 1);
    }
  } catch (error) {
    log('ℹ️ Could not check processes, continuing...', 'cyan');
  }
};

// Gentle cleanup without removing Prisma
const gentleCleanup = async () => {
  log('🧹 Performing gentle cleanup...', 'yellow');
  
  const pathsToCheck = [
    'node_modules/.prisma/client/query_engine-windows.dll.node',
    'node_modules/.prisma/client/query_engine-windows.dll.node.tmp1552',
    'node_modules/.prisma/client/libquery_engine-windows.dll.node'
  ];
  
  for (const filePath of pathsToCheck) {
    try {
      if (fs.existsSync(filePath)) {
        // Try to rename the file first (safer than delete)
        const backupPath = filePath + '.backup.' + Date.now();
        fs.renameSync(filePath, backupPath);
        log(`   ✅ Moved ${path.basename(filePath)} to backup`, 'green');
        
        // Try to delete backup after a delay
        setTimeout(() => {
          try {
            fs.unlinkSync(backupPath);
          } catch (err) {
            // Ignore errors when deleting backup
          }
        }, 5000);
      }
    } catch (error) {
      log(`   ⚠️ Could not move ${path.basename(filePath)}: ${error.message}`, 'yellow');
    }
  }
};

// Fix permissions on Windows
const fixWindowsPermissions = async () => {
  if (process.platform !== 'win32') return;
  
  log('🔐 Attempting to fix Windows permissions...', 'yellow');
  
  const prismaPath = path.join('node_modules', '.prisma');
  if (fs.existsSync(prismaPath)) {
    try {
      // Use attrib command to remove read-only attribute
      await runCommandWithRetry('attrib', ['-r', path.join(prismaPath, '*'), '/s', '/d'], {}, 1);
      log('   ✅ Removed read-only attributes', 'green');
    } catch (error) {
      log(`   ⚠️ Could not fix permissions: ${error.message}`, 'yellow');
    }
  }
};

// Main fix function
const fixPrismaGentle = async () => {
  try {
    log('🔧 Gentle Prisma Fix (Without Reinstalling)', 'blue');
    log('='.repeat(50), 'blue');
    
    // Step 1: Check processes
    await checkProcesses();
    
    // Step 2: Fix permissions
    await fixWindowsPermissions();
    
    // Step 3: Gentle cleanup
    await gentleCleanup();
    
    // Step 4: Clear npm cache (but keep packages)
    log('🗑️ Clearing npm cache...', 'yellow');
    try {
      await runCommandWithRetry('npm', ['cache', 'clean', '--force'], {}, 1);
      log('   ✅ Cache cleared', 'green');
    } catch (error) {
      log(`   ⚠️ Cache clear failed: ${error.message}`, 'yellow');
    }
    
    // Step 5: Try to generate Prisma client with different approaches
    log('🔄 Attempting Prisma generation...', 'yellow');
    
    const generateMethods = [
      // Method 1: Standard generate
      { command: 'npx', args: ['prisma', 'generate'] },
      // Method 2: Force generate
      { command: 'npx', args: ['prisma', 'generate', '--generator', 'client'] },
      // Method 3: Generate with data proxy (sometimes helps)
      { command: 'npx', args: ['prisma', 'generate', '--data-proxy'] }
    ];
    
    let success = false;
    
    for (const method of generateMethods) {
      if (success) break;
      
      try {
        log(`   Trying: ${method.command} ${method.args.join(' ')}`, 'cyan');
        await runCommandWithRetry(method.command, method.args, {}, 2);
        success = true;
        log('   ✅ Prisma client generated successfully!', 'green');
        break;
      } catch (error) {
        log(`   ❌ Method failed: ${error.message}`, 'red');
      }
    }
    
    if (!success) {
      log('⚠️ All generation methods failed. Trying alternative approach...', 'yellow');
      
      // Alternative: Try to run with different environment
      try {
        process.env.PRISMA_ENGINES_MIRROR = 'https://binaries.prisma.sh';
        await runCommandWithRetry('npx', ['prisma', 'generate'], {
          env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true' }
        }, 1);
        success = true;
        log('   ✅ Alternative method succeeded!', 'green');
      } catch (error) {
        log(`   ❌ Alternative method also failed: ${error.message}`, 'red');
      }
    }
    
    // Step 6: Test if migration can now work
    if (success) {
      log('🧪 Testing migration...', 'yellow');
      try {
        // Don't actually run migration, just check if Prisma client works
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        log('   ✅ Prisma client is working!', 'green');
      } catch (error) {
        log(`   ⚠️ Prisma client test failed: ${error.message}`, 'yellow');
        log('   But generation succeeded, you can try migration manually', 'cyan');
      }
    }
    
    // Summary
    log('', '');
    log('='.repeat(50), 'blue');
    log('📋 GENTLE FIX SUMMARY', 'blue');
    log('='.repeat(50), 'blue');
    
    if (success) {
      log('✅ Prisma fix completed successfully!', 'green');
      log('📋 Next steps:', 'cyan');
      log('   1. Try running: npm run migrate', 'white');
      log('   2. If that works, start your server: npm run dev', 'white');
    } else {
      log('❌ Gentle fix could not resolve the issue.', 'red');
      log('💡 Suggested next steps:', 'cyan');
      log('   1. Close all terminals and VS Code', 'white');
      log('   2. Run Command Prompt as Administrator', 'white');
      log('   3. Navigate to your project folder', 'white');
      log('   4. Run: npx prisma generate', 'white');
      log('   5. If that works, run: npm run migrate', 'white');
    }
    
  } catch (error) {
    log(`💥 Gentle fix failed: ${error.message}`, 'red');
    console.error(error);
  }
};

// Run if this script is executed directly
if (require.main === module) {
  fixPrismaGentle();
}

module.exports = { fixPrismaGentle };