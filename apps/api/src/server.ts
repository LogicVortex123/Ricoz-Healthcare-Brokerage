import { spawn } from 'child_process';
import path from 'path';
import { createApp } from './app';
import { connectDb, databaseErrorMessage } from './config/db';
import { loadEnv } from './config/env';

const onRender = process.env.RENDER === 'true';
const publicPort = onRender ? process.env.PORT || '10000' : '';
if (onRender) process.env.PORT = '4000';

function startWebsite() {
  const webDir = path.resolve(__dirname, '../../web');
  const nextBin = path.resolve(__dirname, '../../../node_modules/next/dist/bin/next');
  const website = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', publicPort], {
    cwd: webDir,
    env: {
      ...process.env,
      PORT: publicPort,
      API_PROXY_URL: 'http://127.0.0.1:4000',
      NODE_ENV: 'production',
    },
    stdio: 'inherit',
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
