import { createApp } from './app';
import { connectDb, databaseErrorMessage } from './config/db';
import { loadEnv } from './config/env';

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
  app.listen(env.port, () => {
    console.log(`[practicebridge] API listening on http://localhost:${env.port}`);
  });
}

void main();
