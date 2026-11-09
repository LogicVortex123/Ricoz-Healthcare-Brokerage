import mongoose from 'mongoose';
import { redactSecrets } from '../utils/secrets';

mongoose.set('strictQuery', true);

export async function connectDb(uri: string, dbName = 'ricoz_healthcare') {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
    autoIndex: true,
  });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function databaseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  return redactSecrets(message);
}
