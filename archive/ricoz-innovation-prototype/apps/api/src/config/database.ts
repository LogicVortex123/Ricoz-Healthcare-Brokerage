import mongoose from 'mongoose';

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recoz_dental_transitions';
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true,
    });
    console.log(`[Database] MongoDB successfully connected at: ${uri}`);
    return true;
  } catch (err: any) {
    console.warn(`[Database] MongoDB not reachable at ${uri} (${err.message}). API operating in hybrid mock/memory mode.`);
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

