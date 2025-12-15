#!/usr/bin/env node

/**
 * Wrapper script to run Vercel CLI with token from .env.local
 * Usage: node scripts/vercel-with-token.js [vercel-command] [args...]
 * Example: node scripts/vercel-with-token.js env pull .env.prod --environment=production
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Read .env.local file
const envLocalPath = path.resolve(process.cwd(), '.env.local');
let vercelToken = process.env.VERCEL_TOKEN;

if (!vercelToken && fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const tokenMatch = envContent.match(/^VERCEL_TOKEN=(.+)$/m);
  if (tokenMatch) {
    vercelToken = tokenMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }
}

if (!vercelToken) {
  console.error('Error: VERCEL_TOKEN not found in .env.local or environment variables');
  process.exit(1);
}

// Read .vercel/project.json for project and team IDs
const projectJsonPath = path.resolve(process.cwd(), '.vercel/project.json');
let projectId = null;
let orgId = null;

if (fs.existsSync(projectJsonPath)) {
  try {
    const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    projectId = projectJson.projectId;
    orgId = projectJson.orgId;
  } catch (error) {
    console.warn('Warning: Could not parse .vercel/project.json:', error.message);
  }
}

// Get all arguments after the script name
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Error: No Vercel command provided');
  console.error('Usage: npm run vercel [command] [args...]');
  console.error('Example: npm run vercel env pull .env.prod --environment=production');
  process.exit(1);
}

// Build vercel args with token, scope (team), and project
const vercelArgs = [...args];

// Add scope (team/org ID) if available and not already specified
if (orgId && !args.some(arg => arg === '--scope' || arg === '-S' || arg.startsWith('--scope='))) {
  vercelArgs.push('--scope', orgId);
}

// Add project ID if available and not already specified
// Note: Vercel CLI doesn't have a direct --project flag, but we can ensure .vercel/project.json exists
// Some commands accept project via environment or context, but most use the .vercel directory

// Add token (always add it)
vercelArgs.push('--token', vercelToken);

// Set up environment variables for the child process
const env = {
  ...process.env,
  VERCEL_TOKEN: vercelToken,
};

// Add project and org IDs as environment variables (some Vercel tools may use these)
if (projectId) {
  env.VERCEL_PROJECT_ID = projectId;
}
if (orgId) {
  env.VERCEL_ORG_ID = orgId;
}

const child = spawn('npx', ['vercel', ...vercelArgs], {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('error', (error) => {
  console.error('Error running vercel:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

