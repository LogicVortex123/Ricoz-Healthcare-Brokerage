import { spawn, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { createApp } from './app';
import { connectDb, databaseErrorMessage } from './config/db';
import { loadEnv } from './config/env';

const onRender = process.env.RENDER === 'true';
const publicPort = onRender ? process.env.PORT || '10000' : '';
const apiPort = publicPort === '4000' ? '4001' : '4000';
if (onRender) process.env.PORT = apiPort;

function websitePaths() {
  const webDir = path.resolve(__dirname, '../../web');
  const root = path.resolve(__dirname, '../../..');
  const candidates = [
    path.join(webDir, 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'),
  ];
  const nextBin = candidates.find((candidate) => existsSync(candidate));
  return { webDir, root, nextBin };
}

function ensureWebsiteBuild(root: string, webDir: string) {
  if (existsSync(path.join(webDir, '.next', 'BUILD_ID'))) return;
  console.log('[practicebridge] Website build is missing. Building it before startup.');
  const result = spawnSync('npm', ['run', 'build', '-w', '@ricoz/web'], {
    cwd: root,
    env: {
      ...process.env,
      API_PROXY_URL: `http://127.0.0.1:${apiPort}`,
      NEXT_PUBLIC_API_URL: '',
      NODE_ENV: 'production',
    },
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0 || !existsSync(path.join(webDir, '.next', 'BUILD_ID'))) {
    console.error('[practicebridge] Website build failed, so the site cannot start.');
    process.exit(result.status || 1);
  }
}

function startWebsite() {
  const { webDir, root, nextBin } = websitePaths();
  ensureWebsiteBuild(root, webDir);
  if (!nextBin) {
    console.error('[practicebridge] Could not find the Next.js program in node_modules.');
    process.exit(1);
  }
  console.log(`[practicebridge] Starting website on port ${publicPort} with ${nextBin}`);
  const website = spawn(process.execPath, [nextBin, 'start', '--hostname', '0.0.0.0', '--port', publicPort], {
    cwd: webDir,
    env: {
      ...process.env,
      PORT: publicPort,
      API_PROXY_URL: `http://127.0.0.1:${apiPort}`,
      NODE_ENV: 'production',
    },
    stdio: 'inherit',
  });
  website.on('error', (error) => {
    console.error(`[practicebridge] Website failed to start. ${error.message}`);
    process.exit(1);
  });
  website.on('exit', (code) => {
    console.error(`[practicebridge] Website stopped (${code ?? 'unknown'}).`);
    process.exit(code ?? 1);
  });
}

async function main() {
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Configuration error';
    console.error(`[practicebridge] ${message}`);
    process.exit(1);
  }

  try {
    await connectDb(env.mongodbUri);
    console.log('[practicebridge] Connected to MongoDB database ricoz_healthcare');
  } catch (error) {
    console.error(`[practicebridge] Database connection failed. ${databaseErrorMessage(error)}`);
    process.exit(1);
  }

  const app = createApp(env);
  const onListening = () => {
    console.log(`[practicebridge] API listening on http://127.0.0.1:${env.port}`);
    if (onRender) {
      console.log(`[practicebridge] Website listening on port ${publicPort}`);
      startWebsite();
    }
  };
  if (onRender) app.listen(env.port, '127.0.0.1', onListening);
  else app.listen(env.port, onListening);
}

void main();
