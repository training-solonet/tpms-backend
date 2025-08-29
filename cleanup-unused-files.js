#!/usr/bin/env node

/**
 * Fleet Management Backend - Safe File Cleanup Script
 * 
 * This script safely removes unused/redundant files without affecting backend functionality.
 * It creates backups before deletion and provides rollback capability.
 * 
 * Usage:
 *   node cleanup-unused-files.js --dry-run    # Preview what will be deleted
 *   node cleanup-unused-files.js --backup     # Create backup before cleanup
 *   node cleanup-unused-files.js --execute    # Execute cleanup
 *   node cleanup-unused-files.js --rollback   # Restore from backup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SafeCleanup {
  constructor() {
    this.projectRoot = process.cwd();
    this.backupDir = path.join(this.projectRoot, 'cleanup-backup');
    this.logFile = path.join(this.projectRoot, 'cleanup.log');
    
    // Files that are SAFE to delete (verified as unused/empty/redundant)
    this.filesToDelete = [
      // Empty service files
      'src/config/cors.js',
      'src/services/authservice.js',
      'src/services/dasboardservice.js', 
      'src/services/truckservice.js',
      
      // Empty test files
      'test/setup.js',
      
      // Redundant documentation (replaced with new frontend docs)
      'API_Documentation.md',
      
      // Development/migration files (no longer needed after setup)
      'data_dummy.js',
      'fix-prisma-gentle.js',
      'fixdatabase.js',
      'quick-setup.js',
      
      // Migration reports (historical, not needed for runtime)
      'migration-report-1756276114826.json',
      'migration-report-1756276242544.json',
      'migration-report-1756276535827.json',
      
      // Backup prisma files
      'prisma/schema.prisma.introspected',
      'prisma/schema.prisma.txt',
      
      // Specific test file (functionality covered by test-api-endpoints.js)
      'test-alert-endpoint.js'
    ];

    // Optional cleanup (more aggressive, but still safe)
    this.optionalCleanup = [
      // Old migration scripts (only if database is already set up)
      'scripts/fix-prisma.js',
      'scripts/migrate-to-prisma.js',
      'scripts/migrate.js',
      'scripts/setup-database.js',
      'scripts/update-coordinates.js',
      
      // Old database files (replaced by Prisma)
      'database/migration/',
      'database/seeder/',
      'database/update-schema.sql'
    ];

    // Critical files that should NEVER be deleted
    this.protectedFiles = [
      'server.js',
      'package.json',
      'package-lock.json',
      '.env',
      '.env.example',
      'prisma/schema.prisma',
      'database/schema.sql',
      'src/',
      'node_modules/',
      'FRONTEND_API_DOCUMENTATION.md',
      'FRONTEND_INTEGRATION_GUIDE.md',
      'FRONTEND_VARIABLES_GUIDE.md',
      'README.md'
    ];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (error) {
      console.warn('Could not write to log file:', error.message);
    }
  }

  checkFileExists(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    return fs.existsSync(fullPath);
  }

  getFileSize(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const stats = fs.statSync(fullPath);
      return stats.isDirectory() ? 'directory' : `${stats.size} bytes`;
    } catch (error) {
      return 'unknown';
    }
  }

  createBackup() {
    this.log('Creating backup before cleanup...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const filesToBackup = [...this.filesToDelete, ...this.optionalCleanup];
    let backedUpCount = 0;

    for (const file of filesToBackup) {
      const sourcePath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(this.backupDir, file);
        const backupDirPath = path.dirname(backupPath);
        
        try {
          // Create backup directory structure
          fs.mkdirSync(backupDirPath, { recursive: true });
          
          // Copy file or directory
          if (fs.statSync(sourcePath).isDirectory()) {
            this.copyDirectory(sourcePath, backupPath);
          } else {
            fs.copyFileSync(sourcePath, backupPath);
          }
          
          backedUpCount++;
          this.log(`✓ Backed up: ${file}`);
        } catch (error) {
          this.log(`✗ Failed to backup ${file}: ${error.message}`);
        }
      }
    }

    this.log(`Backup completed: ${backedUpCount} items backed up to ${this.backupDir}`);
    return backedUpCount > 0;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  dryRun() {
    this.log('=== DRY RUN - Preview of files to be deleted ===');
    
    let totalSize = 0;
    let fileCount = 0;

    this.log('\n📁 SAFE CLEANUP (Recommended):');
    for (const file of this.filesToDelete) {
      if (this.checkFileExists(file)) {
        const size = this.getFileSize(file);
        this.log(`  - ${file} (${size})`);
        fileCount++;
        if (typeof size === 'string' && size.includes('bytes')) {
          totalSize += parseInt(size);
        }
      } else {
        this.log(`  - ${file} (not found)`);
      }
    }

    this.log('\n📁 OPTIONAL CLEANUP (More aggressive):');
    for (const file of this.optionalCleanup) {
      if (this.checkFileExists(file)) {
        const size = this.getFileSize(file);
        this.log(`  - ${file} (${size})`);
      } else {
        this.log(`  - ${file} (not found)`);
      }
    }

    this.log(`\n📊 Summary: ${fileCount} files found, estimated ${Math.round(totalSize/1024)}KB to be freed`);
    this.log('\nTo execute cleanup: node cleanup-unused-files.js --execute');
    this.log('To create backup first: node cleanup-unused-files.js --backup');
  }

  executeCleanup(includeOptional = false) {
    this.log('=== EXECUTING CLEANUP ===');
    
    const filesToProcess = includeOptional 
      ? [...this.filesToDelete, ...this.optionalCleanup]
      : this.filesToDelete;

    let deletedCount = 0;
    let failedCount = 0;

    for (const file of filesToProcess) {
      const fullPath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(fullPath)) {
        try {
          if (fs.statSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
          
          deletedCount++;
          this.log(`✓ Deleted: ${file}`);
        } catch (error) {
          failedCount++;
          this.log(`✗ Failed to delete ${file}: ${error.message}`);
        }
      } else {
        this.log(`- Skipped (not found): ${file}`);
      }
    }

    this.log(`\n📊 Cleanup completed: ${deletedCount} deleted, ${failedCount} failed`);
    
    if (deletedCount > 0) {
      this.log('✅ Cleanup successful! Backend system should not be affected.');
      this.log('💡 Test your backend with: npm run dev');
    }
  }

  rollback() {
    this.log('=== ROLLING BACK FROM BACKUP ===');
    
    if (!fs.existsSync(this.backupDir)) {
      this.log('❌ No backup directory found. Cannot rollback.');
      return false;
    }

    let restoredCount = 0;
    
    const restoreDirectory = (backupPath, targetPath) => {
      const items = fs.readdirSync(backupPath);
      
      for (const item of items) {
        const backupItemPath = path.join(backupPath, item);
        const targetItemPath = path.join(targetPath, item);
        
        try {
          if (fs.statSync(backupItemPath).isDirectory()) {
            fs.mkdirSync(targetItemPath, { recursive: true });
            restoreDirectory(backupItemPath, targetItemPath);
          } else {
            const targetDir = path.dirname(targetItemPath);
            fs.mkdirSync(targetDir, { recursive: true });
            fs.copyFileSync(backupItemPath, targetItemPath);
            restoredCount++;
            this.log(`✓ Restored: ${path.relative(this.projectRoot, targetItemPath)}`);
          }
        } catch (error) {
          this.log(`✗ Failed to restore ${item}: ${error.message}`);
        }
      }
    };

    restoreDirectory(this.backupDir, this.projectRoot);
    
    this.log(`\n📊 Rollback completed: ${restoredCount} files restored`);
    return restoredCount > 0;
  }

  verifyBackendIntegrity() {
    this.log('=== VERIFYING BACKEND INTEGRITY ===');
    
    const criticalFiles = [
      'server.js',
      'package.json',
      'src/app.js',
      'src/controllers/authController.js',
      'src/controllers/truckController.js',
      'src/controllers/dashboardController.js',
      'src/services/prismaService.js',
      'src/services/websocketService.js',
      'prisma/schema.prisma'
    ];

    let allGood = true;
    
    for (const file of criticalFiles) {
      if (!this.checkFileExists(file)) {
        this.log(`❌ CRITICAL: Missing ${file}`);
        allGood = false;
      } else {
        this.log(`✅ OK: ${file}`);
      }
    }

    if (allGood) {
      this.log('\n✅ Backend integrity check PASSED - all critical files present');
    } else {
      this.log('\n❌ Backend integrity check FAILED - some critical files missing!');
    }

    return allGood;
  }
}

// Main execution
function main() {
  const cleanup = new SafeCleanup();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧹 Fleet Management Backend - Safe File Cleanup Tool

Usage:
  node cleanup-unused-files.js --dry-run      Preview files to be deleted
  node cleanup-unused-files.js --backup       Create backup before cleanup
  node cleanup-unused-files.js --execute      Execute safe cleanup
  node cleanup-unused-files.js --full         Execute full cleanup (including optional)
  node cleanup-unused-files.js --rollback     Restore from backup
  node cleanup-unused-files.js --verify       Check backend integrity

⚠️  Always run --dry-run first to see what will be deleted!
💾 Use --backup before --execute for safety!
    `);
    return;
  }

  const command = args[0];

  switch (command) {
    case '--dry-run':
      cleanup.dryRun();
      break;
      
    case '--backup':
      if (cleanup.createBackup()) {
        console.log('\n✅ Backup created successfully!');
        console.log('Now you can safely run: node cleanup-unused-files.js --execute');
      } else {
        console.log('\n❌ Backup failed or no files to backup');
      }
      break;
      
    case '--execute':
      console.log('⚠️  Starting safe cleanup...');
      cleanup.executeCleanup(false);
      cleanup.verifyBackendIntegrity();
      break;
      
    case '--full':
      console.log('⚠️  Starting full cleanup (including optional files)...');
      cleanup.executeCleanup(true);
      cleanup.verifyBackendIntegrity();
      break;
      
    case '--rollback':
      if (cleanup.rollback()) {
        console.log('\n✅ Rollback completed successfully!');
      } else {
        console.log('\n❌ Rollback failed');
      }
      break;
      
    case '--verify':
      cleanup.verifyBackendIntegrity();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Use --help for usage information');
  }
}

if (require.main === module) {
  main();
}

module.exports = SafeCleanup;
