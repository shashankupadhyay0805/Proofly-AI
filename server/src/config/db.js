import mongoose from 'mongoose';

export async function connectToDb(mongoUri) {
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);

  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
}

