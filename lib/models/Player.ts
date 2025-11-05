import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  recurring: boolean;
}

export interface IPlayer extends Document {
  name: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;

  // Authentication fields
  email?: string;
  emailVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  profileClaimed: boolean;
  role: 'admin' | 'user' | 'guest';

  // Profile fields
  bio?: string;
  playStyle?: string;
  favoriteGames: string[]; // Game IDs or names
  availability: IAvailability[];

  // Privacy settings
  publicProfile: boolean;
  showStats: boolean;

  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
}

const AvailabilitySchema = new Schema<IAvailability>({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  recurring: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    photoPublicId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Authentication fields
    email: {
      type: String,
      sparse: true, // Allows multiple null values while enforcing uniqueness for non-null
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false, // Don't return OTP in queries by default
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    profileClaimed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'guest'],
      default: 'user',
    },

    // Profile fields
    bio: {
      type: String,
      maxlength: 500,
    },
    playStyle: {
      type: String,
      enum: ['Casual', 'Competitive', 'Social', 'Strategic', 'Any', ''],
      default: '',
    },
    favoriteGames: {
      type: [String],
      default: [],
    },
    availability: {
      type: [AvailabilitySchema],
      default: [],
    },

    // Privacy settings
    publicProfile: {
      type: Boolean,
      default: true,
    },
    showStats: {
      type: Boolean,
      default: true,
    },

    lastPlayedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (name already indexed via unique: true, email indexed via unique: true)
PlayerSchema.index({ lastPlayedAt: -1 });
PlayerSchema.index({ isActive: 1 });
PlayerSchema.index({ role: 1 });

export default mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);
