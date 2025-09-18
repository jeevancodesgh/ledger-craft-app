#!/usr/bin/env node

/**
 * Automatically update version based on git commits
 * Usage: node scripts/auto-version.js [major|minor|patch]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version bump type from command line or default to patch
const bumpType = process.argv[2] || 'patch';

console.log(`🔄 Auto-bumping ${bumpType} version...`);

try {
  // Check if we're in a git repository
  execSync('git status', { stdio: 'ignore' });
  
  // Get current version from package.json
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  console.log(`📦 Current version: ${currentVersion}`);
  
  // Use npm version to bump version
  const newVersion = execSync(`npm version ${bumpType} --no-git-tag-version`, { 
    encoding: 'utf8' 
  }).trim().replace('v', '');
  
  console.log(`🚀 New version: ${newVersion}`);
  
  // Get git info for commit message
  const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  
  // Create git tag
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  
  console.log(`✅ Created git tag: v${newVersion}`);
  console.log(`📝 Commit: ${commitHash} on ${branch}`);
  console.log(`🎉 Version bump complete!`);
  
  // Generate version.json with new version
  execSync('node scripts/generate-version.js');
  
} catch (error) {
  console.error('❌ Error during version bump:', error.message);
  process.exit(1);
}
