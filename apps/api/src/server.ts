import { createRequire } from 'module';
import { existsSync } from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { createApp } from './app';
import { connectDb, databaseErrorMessage } from './config/db';
import { loadEnv } from './config/env';

const nodeRequire = createRequire(__filename);
const onRender = process.env.RENDER === 'true';

type NextServer = {
  prepare: () => Promise<void>;
  getRequestHandler: () => (req: Request, res: Response) => Promise<void>;
};

type NextFactory = (options: { dev: boolean; dir: string; hostname: string; port: number }) => NextServer;

function websiteDir() {
  return path.resolve(__dirname, '../../web');
}

function loadNext(webDir: string): NextFactory {
  const candidates = [
    path.join(webDir, 'node_modules', 'next'),
    path.resolve(__dirname, '../../../node_modules/next'),
  ];
  const nextPackage = candidates.find((candidate) => existsSync(candidate));
  if (!nextPackage) {
    throw new Error('Could not find the Next.js program in node_modules.');
  }
  return nodeRequire(nextPackage) as NextFactory;
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

  let website: ((req: Request, res: Response) => void) | undefined;
  if (onRender) {
    const webDir = websiteDir();
    if (!existsSync(path.join(webDir, '.next', 'BUILD_ID'))) {
      console.error('[practicebridge] The website build is missing. Redeploy so the build can finish.');
      process.exit(1);
    }
    const nextApp = loadNext(webDir)({ dev: false, dir: webDir, hostname: '0.0.0.0', port: env.port });
    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();
    website = (req, res) => {
      void handle(req, res);
    };
  }

  const app = createApp(env, { website });

  const onListening = () => {
    console.log(`[practicebridge] Listening on port ${env.port}`);
  };
  if (onRender) app.listen(env.port, '0.0.0.0', onListening);
  else app.listen(env.port, onListening);
}

void main();
