import mongoose, { Schema, Model } from 'mongoose';

const HomepageSettingsSchema = new Schema({
  videoUrl:     { type: String, default: '' },       // YouTube URL
  videoTitle:   { type: String, default: '' },
  videoDesc:    { type: String, default: '' },
  videoPublished: { type: Boolean, default: false },
}, { timestamps: true });

export const HomepageSettings: Model<typeof HomepageSettingsSchema> =
  mongoose.models.HomepageSettings ||
  mongoose.model('HomepageSettings', HomepageSettingsSchema);
