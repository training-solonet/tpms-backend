const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function fixPrismaAndMigrate() {
  try {
    log('🔧 Starting Prisma fix process...', 'blue');
    log('==============================', 'blue');
    
    // Step 1: Kill any running Node processes
    log('1. Stopping all Node.js processes...', 'yellow');
    try {
      if (process.platform === 'win32') {
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
        log('   ✅ Windows Node processes stopped', 'green');
      } else {
        execSync('pkill -f node', { stdio: 'ignore' });
        log('   ✅ Node processes stopped', 'green');
      }
    } catch (e) {
      log('   ℹ️  No Node processes to stop', 'cyan');
    }
    
    // Wait a moment for processes to fully close
    log('2. Waiting for processes to close...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));
    log('   ✅ Wait complete', 'green');
    
    // Step 2: Clean npm cache
    log('3. Cleaning npm cache...', 'yellow');
    try {
      execSync('npm cache clean --force', { stdio: 'pipe' });
      log('   ✅ npm cache cleaned', 'green');
    } catch (e) {
      log('   ⚠️  Cache clean failed, continuing...', 'yellow');
    }
    
    // Step 3: Remove .prisma directory
    log('4. Removing old Prisma client...', 'yellow');
    const prismaDir = path.join(__dirname, '..', 'node_modules', '.prisma');
    const prismaClientDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
    
    try {
      if (fs.existsSync(prismaDir)) {
        fs.rmSync(prismaDir, { recursive: true, force: true });
        log('   ✅ Removed .prisma directory', 'green');
      }
      
      if (fs.existsSync(prismaClientDir)) {
        fs.rmSync(prismaClientDir, { recursive: true, force: true });
        log('   ✅ Removed @prisma/client directory', 'green');
      }
    } catch (e) {
      log(`   ⚠️  Could not remove directories: ${e.message}`, 'yellow');
    }
    
    // Step 4: Reinstall Prisma packages
    log('5. Reinstalling Prisma packages...', 'yellow');
    try {
      execSync('npm uninstall @prisma/client prisma', { stdio: 'pipe' });
      log('   ✅ Uninstalled old Prisma packages', 'green');
      
      execSync('npm install @prisma/client prisma', { stdio: 'pipe' });
      log('   ✅ Reinstalled Prisma packages', 'green');
    } catch (e) {
      log(`   ⚠️  Package reinstall failed: ${e.message}`, 'yellow');
    }
    
    // Step 5: Generate new Prisma client
    log('6. Generating new Prisma client...', 'yellow');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      log('   ✅ Prisma client generated successfully', 'green');
    } catch (e) {
      log(`   ❌ Prisma generate failed: ${e.message}`, 'red');
      throw e;
    }
    
    // Step 6: Try the migration
    log('7. Running migration...', 'yellow');
    try {
      execSync('npm run migrate', { stdio: 'inherit' });
      log('   ✅ Migration completed successfully!', 'green');
    } catch (e) {
      log(`   ❌ Migration failed: ${e.message}`, 'red');
      
      // Fallback: suggest using existing setup
      log('', 'reset');
      log('💡 Fallback Solution:', 'cyan');
      log('Your database setup already works with raw SQL queries.', 'cyan');
      log('You can continue development without Prisma:', 'cyan');
      log('  npm run setup:db', 'yellow');
      log('  npm run dev', 'yellow');
      
      return false;
    }
    
    log('', 'reset');
    log('🎉 Prisma fix completed successfully!', 'green');
    log('==============================', 'blue');
    
    return true;
    
  } catch (error) {
    log(`❌ Fix process failed: ${error.message}`, 'red');
    
    log('', 'reset');
    log('🔧 Alternative Solutions:', 'cyan');
    log('1. Run as Administrator:', 'yellow');
    log('   - Right-click Command Prompt → "Run as administrator"', 'yellow');
    log('   - Navigate to project and try again', 'yellow');
    log('', 'reset');
    log('2. Disable antivirus temporarily and try again', 'yellow');
    log('', 'reset');
    log('3. Use existing working setup:', 'yellow');
    log('   npm run setup:db', 'cyan');
    log('   npm run dev', 'cyan');
    
    return false;
  }
}

// Alternative function to bypass Prisma entirely
async function useExistingSetup() {
  try {
    log('🚀 Using existing database setup...', 'blue');
    
    // Run the working setup script
    execSync('npm run setup:db', { stdio: 'inherit' });
    
    log('✅ Database setup complete! You can now run:', 'green');
    log('  npm run dev', 'cyan');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--skip-prisma') || args.includes('--use-existing')) {
    useExistingSetup();
  } else {
    fixPrismaAndMigrate().then(success => {
      if (!success) {
        log('', 'reset');
        log('Would you like to use the existing setup instead? Run:', 'cyan');
        log('  node scripts/fix-prisma.js --use-existing', 'yellow');
      }
    });
  }
}

module.exports = {
  fixPrismaAndMigrate,
  useExistingSetup
};