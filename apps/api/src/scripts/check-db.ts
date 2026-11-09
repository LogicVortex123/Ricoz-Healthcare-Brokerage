import { connectDb, databaseErrorMessage, disconnectDb } from '../config/db';
import { loadEnv } from '../config/env';
import mongoose from 'mongoose';

async function main() {
  const env = loadEnv();
  try {
    await connectDb(env.mongodbUri);
    await mongoose.connection.db?.command({ ping: 1 });
    console.log(`[practicebridge] Connected. Database name: ${mongoose.connection.name}`);
  } catch (error) {
    console.error(`[practicebridge] Database connection failed. ${databaseErrorMessage(error)}`);
    process.exitCode = 1;
  } finally {
    await disconnectDb();
  }
}

void main();
