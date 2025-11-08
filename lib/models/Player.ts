import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  recurring: boolean;
}


// Validator function for array length
function arrayLimit(val: any): boolean {
  if (val === undefined || val === null) return true;
  if (!Array.isArray(val)) return false;
  return val.length <= 3;
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
  topFavoriteGames: string[]; // Top 3 favorite games
  leastFavoriteGames: string[]; // 3 least favorite games
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
      maxlength: 100,
      trim: true,
      default: '',
    },
    topFavoriteGames: {
      type: [String],
      validate: [arrayLimit, 'Top favorite games cannot exceed 3 items'],
      default: () => [],
    },
    leastFavoriteGames: {
      type: [String],
      validate: [arrayLimit, 'Least favorite games cannot exceed 3 items'],
      default: () => [],
    },
    availability: {
      type: [AvailabilitySchema],
      default: () => [],
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

// Clear cached model to ensure schema updates are applied
if (mongoose.models.Player) {
  delete mongoose.models.Player;
}

export default mongoose.model<IPlayer>('Player', PlayerSchema);
