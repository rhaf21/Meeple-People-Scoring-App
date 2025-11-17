import mongoose, { Document, Schema, Types } from 'mongoose';

export type RSVPStatus = 'going' | 'maybe' | 'not-going';
export type GameNightStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface IAttendee {
  playerId: Types.ObjectId;
  playerName: string;
  rsvpStatus: RSVPStatus;
  rsvpAt: Date;
}

export interface IGameNight extends Document {
  title: string;
  description?: string;
  scheduledDate: Date;
  location?: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  attendees: IAttendee[];
  suggestedGames: Types.ObjectId[]; // Game IDs
  status: GameNightStatus;
  maxAttendees?: number;
  isPrivate: boolean;
  notes?: string;
  // Google Calendar Integration
  invitedPlayerIds: Types.ObjectId[]; // Players selected to receive calendar invites
  googleCalendarEventId?: string; // Google Calendar event ID for syncing
  googleCalendarUrl?: string; // Direct link to view event in Google Calendar
  calendarSyncEnabled: boolean; // Whether calendar sync is active
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>({
  playerId: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  rsvpStatus: {
    type: String,
    required: true,
    enum: ['going', 'maybe', 'not-going'],
    default: 'going',
  },
  rsvpAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const GameNightSchema = new Schema<IGameNight>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    attendees: {
      type: [AttendeeSchema],
      default: [],
    },
    suggestedGames: {
      type: [Schema.Types.ObjectId],
      ref: 'GameDefinition',
      default: [],
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    maxAttendees: {
      type: Number,
      min: 2,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    // Google Calendar Integration fields
    invitedPlayerIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Player',
      default: [],
    },
    googleCalendarEventId: {
      type: String,
    },
    googleCalendarUrl: {
      type: String,
    },
    calendarSyncEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
GameNightSchema.index({ scheduledDate: 1, status: 1 });
GameNightSchema.index({ createdBy: 1 });
GameNightSchema.index({ 'attendees.playerId': 1 });
GameNightSchema.index({ status: 1 });

// Virtual for getting count of confirmed attendees
GameNightSchema.virtual('goingCount').get(function() {
  return this.attendees.filter(a => a.rsvpStatus === 'going').length;
});

// Virtual for getting count of maybe attendees
GameNightSchema.virtual('maybeCount').get(function() {
  return this.attendees.filter(a => a.rsvpStatus === 'maybe').length;
});

// Ensure virtuals are included in JSON
GameNightSchema.set('toJSON', { virtuals: true });
GameNightSchema.set('toObject', { virtuals: true });

export default mongoose.models.GameNight || mongoose.model<IGameNight>('GameNight', GameNightSchema);
