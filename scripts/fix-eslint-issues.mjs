#!/usr/bin/env node
/**
 * Automated ESLint Issue Fixer
 * Fixes common eslint issues across the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const stats = {
  filesScanned: 0,
  filesModified: 0,
  apostrophesFix: 0,
  quotesFix: 0,
  unusedVarsCommented: 0,
};

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return false;
  
  // Skip node_modules, .next, etc.
  if (filePath.includes('node_modules')) return false;
  if (filePath.includes('.next')) return false;
  if (filePath.includes('dist')) return false;
  if (filePath.includes('build')) return false;
  
  return true;
}

function fixUnescapedEntities(content) {
  let modified = false;
  let fixedContent = content;
  
  // Fix apostrophes in JSX text content
  // Match content between > and < that contains unescaped apostrophes
  const apostropheMatches = fixedContent.matchAll(/>([^<>{}]*)'([^<>{}]*)</g);
  for (const match of Array.from(apostropheMatches)) {
    const fullMatch = match[0];
    const fixed = fullMatch.replace(/'/g, '&apos;');
    if (fullMatch !== fixed) {
      fixedContent = fixedContent.replace(fullMatch, fixed);
      modified = true;
      stats.apostrophesFix++;
    }
  }
  
  // Fix double quotes in JSX text content
  const quoteMatches = fixedContent.matchAll(/>([^<>{}]*)"([^<>{}]*)</g);
  for (const match of Array.from(quoteMatches)) {
    const fullMatch = match[0];
    // Don't replace quotes in JSX expressions
    if (!fullMatch.includes('{')) {
      const fixed = fullMatch.replace(/"/g, '&quot;');
      if (fullMatch !== fixed) {
        fixedContent = fixedContent.replace(fullMatch, fixed);
        modified = true;
        stats.quotesFix++;
      }
    }
  }
  
  return { content: fixedContent, modified };
}

function commentUnusedImports(content) {
  // This is a simplified version - only comments obvious unused imports
  // Full solution would require AST parsing
  let modified = false;
  let fixedContent = content;
  
  // Pattern: import { Unused } from '...' where Unused is clearly not used
  // This is conservative to avoid breaking code
  
  return { content: fixedContent, modified };
}

function fixFile(filePath) {
  stats.filesScanned++;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileModified = false;
  
  // Fix unescaped entities
  const entitiesResult = fixUnescapedEntities(content);
  if (entitiesResult.modified) {
    content = entitiesResult.content;
    fileModified = true;
  }
  
  if (fileModified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.filesModified++;
    console.log(`✓ Fixed ${path.relative(rootDir, filePath)}`);
  }
}

function walkDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip certain directories
      if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      walkDirectory(fullPath);
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      try {
        fixFile(fullPath);
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err.message);
      }
    }
  }
}

console.log('Starting ESLint auto-fix...\n');

// Process specific directories
const dirsToProcess = [
  path.join(rootDir, 'app'),
  path.join(rootDir, 'components'),
];

dirsToProcess.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`Processing ${path.basename(dir)}/...`);
    walkDirectory(dir);
  }
});

console.log('\n═══════════════════════════════════════');
console.log('ESLint Auto-Fix Summary');
console.log('═══════════════════════════════════════');
console.log(`Files scanned: ${stats.filesScanned}`);
console.log(`Files modified: ${stats.filesModified}`);
console.log(`Apostrophes fixed: ${stats.apostrophesFix}`);
console.log(`Quotes fixed: ${stats.quotesFix}`);
console.log('═══════════════════════════════════════\n');

if (stats.filesModified > 0) {
  console.log('✓ Some issues were fixed automatically.');
  console.log('  Run `bun run lint` again to check remaining issues.\n');
} else {
  console.log('No auto-fixable issues found.\n');
}
