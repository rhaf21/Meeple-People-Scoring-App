import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettings extends Document {
  logoUrl?: string;
  logoPublicId?: string;
  faviconUrl?: string;
  faviconPublicId?: string;
  siteTitle: string;
  primaryColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    logoUrl: {
      type: String,
      default: null,
    },
    logoPublicId: {
      type: String,
      default: null,
    },
    faviconUrl: {
      type: String,
      default: null,
    },
    faviconPublicId: {
      type: String,
      default: null,
    },
    siteTitle: {
      type: String,
      default: 'Farty Meople Scoring App',
    },
    primaryColor: {
      type: String,
      default: '#2563eb', // blue-600
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists (singleton pattern)
SystemSettingsSchema.index({}, { unique: true });

const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
