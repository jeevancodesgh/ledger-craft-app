#!/usr/bin/env node

/**
 * Generate version.json file at build time
 * This ensures the version information is always up-to-date
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Generate a unique hash for this build
const buildTime = Date.now();
const buildHash = crypto
  .createHash('sha256')
  .update(`${packageJson.version}-${buildTime}-${process.env.NODE_ENV || 'development'}`)
  .digest('hex')
  .substring(0, 12);

// Create version object
const versionInfo = {
  version: packageJson.version,
  buildTime,
  hash: buildHash,
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
};

// Write to public directory
const versionPath = path.join(__dirname, '../public/version.json');
fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

// Write to dist directory if it exists (for production builds)
const distVersionPath = path.join(__dirname, '../dist/version.json');
if (fs.existsSync(path.dirname(distVersionPath))) {
  fs.writeFileSync(distVersionPath, JSON.stringify(versionInfo, null, 2));
}

console.log('✅ Version file generated:');
console.log(`   Version: ${versionInfo.version}`);
console.log(`   Hash: ${versionInfo.hash}`);
console.log(`   Build Time: ${new Date(versionInfo.buildTime).toISOString()}`);
console.log(`   Environment: ${versionInfo.environment}`);
