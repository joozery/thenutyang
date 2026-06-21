import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Booking } from './src/models/Booking.js';
import { Article } from './src/models/Article.js';
dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const bookings = await mongoose.connection.db?.collection('bookings').find({}).toArray();
  console.log('Bookings:', bookings);
  const articles = await mongoose.connection.db?.collection('articles').find({}).toArray();
  console.log('Articles:', articles);
  await mongoose.disconnect();
}
check().catch(console.error);
