import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');
  if (global._mongooseConn) return global._mongooseConn;
  global._mongooseConn = mongoose.connect(MONGODB_URI);
  return global._mongooseConn;
}

export default connectDB;
