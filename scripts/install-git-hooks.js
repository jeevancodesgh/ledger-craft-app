#!/usr/bin/env node

/**
 * Install git hooks for automatic versioning
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hookScript = `#!/bin/sh
# Auto-version on commit to master/main

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "🔄 Auto-versioning on $BRANCH branch..."
  
  # Check if this is already a version commit
  if git log -1 --pretty=%B | grep -q "chore: release v"; then
    echo "✅ Version commit detected, skipping auto-version"
    exit 0
  fi
  
  # Run auto-version script
  node scripts/auto-version.js patch
  
  # Add the updated files to the commit
  git add package.json public/version.json
  
  echo "✅ Version auto-bumped!"
fi
`;

try {
  const gitHooksDir = path.join(__dirname, '../.git/hooks');
  const preCommitPath = path.join(gitHooksDir, 'pre-commit');
  
  // Check if .git directory exists
  if (!fs.existsSync(path.join(__dirname, '../.git'))) {
    console.log('❌ Not a git repository. Initialize git first.');
    process.exit(1);
  }
  
  // Create hooks directory if it doesn't exist
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
  }
  
  // Write the pre-commit hook
  fs.writeFileSync(preCommitPath, hookScript);
  
  // Make it executable
  fs.chmodSync(preCommitPath, 0o755);
  
  console.log('✅ Git hooks installed successfully!');
  console.log('📝 Now commits to master/main will auto-bump patch version');
  console.log('💡 To disable: rm .git/hooks/pre-commit');
  
} catch (error) {
  console.error('❌ Error installing git hooks:', error.message);
  process.exit(1);
}
