import path from 'path';
import dotenv from 'dotenv';

export type Env = {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  webOrigin: string;
  cookieSecure: boolean;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to apps/api/.env before starting the API.`);
  }
  return value;
}

export function loadEnv(): Env {
  if (process.env.NODE_ENV !== 'test') {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  }

  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const mongodbUri = required('MONGODB_URI');
  if (mongodbUri.includes('<user>') || mongodbUri.includes('<password>') || mongodbUri.includes('YOUR_')) {
    throw new Error('MONGODB_URI is still a placeholder. Set the Atlas connection string in apps/api/.env.');
  }

  const jwtSecret = required('JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }

  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1) {
    throw new Error('PORT must be a positive integer.');
  }

  return {
    nodeEnv,
    port,
    mongodbUri,
    jwtSecret,
    webOrigin: process.env.WEB_ORIGIN?.trim() || 'http://localhost:3000',
    cookieSecure: nodeEnv === 'production',
  };
}
