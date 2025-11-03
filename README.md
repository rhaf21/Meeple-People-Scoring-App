# Board Game Scoring App

A modern, full-stack web application for tracking board game scores with unique scoring systems. Built with Vite, Express, TypeScript, and MongoDB.

## Features

- **Player Management**: Add and track players without requiring login
- **Game Management**: Add games with different scoring modes
- **Two Scoring Systems**:
  - **Pointing System**: Prize pool divided among top 3 players (2/3 to 1st, 2/3 of remainder to 2nd, rest to 3rd)
  - **Winner Takes All**: Only the winner receives points
- **Game History**: View, edit, and delete past games
- **Statistics Dashboard**:
  - Overall best players
  - Best player per game
  - Separate rankings by player count
  - Overall rankings regardless of player count
- **Data Export**: Export history as CSV or JSON

## Tech Stack

### Frontend
- ⚡ Vite 5
- ⚛️ React 18
- 🎨 Tailwind CSS
- 🔍 TypeScript
- 🔄 TanStack Query (React Query)

### Backend
- 🚀 Express
- 🗄️ MongoDB + Mongoose
- ✅ TypeScript
- 🔐 CORS enabled

### Deployment
- 🌐 Render.com (Free tier)
- ☁️ MongoDB Atlas (Free tier)

## Project Structure

```
scoring-app/
├── client/                 # Vite React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   ├── index.html
│   └── vite.config.ts
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── tsconfig.json
│
└── package.json           # Root package
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd scoring-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scoring-app?retryWrites=true&w=majority
   NODE_ENV=development
   PORT=3000
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend on `http://localhost:5173`
   - Backend on `http://localhost:3000`

## Development

### Available Scripts

**Root**
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm start` - Start production server
- `npm run install:all` - Install all dependencies (root, client, server)

**Client** (in `client/` directory)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Server** (in `server/` directory)
- `npm run dev` - Start Express with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Start production server

## Scoring System

### Pointing System

Prize pool = Number of players × 5 points

**Distribution:**
1. **1st place**: ⅔ of prize pool (rounded up)
2. **2nd place**: ⅔ of remaining (rounded up)
3. **3rd place**: All remaining
4. **4th+ place**: 0 points

**Example** (5 players = 25 point pool):
- 1st: 17 points
- 2nd: 6 points
- 3rd: 2 points
- 4th-5th: 0 points

### Winner Takes All

Prize pool = Number of players × 3 points

**Distribution:**
1. **1st place**: All points
2. **Everyone else**: 0 points

## API Endpoints

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get game by ID
- `POST /api/games` - Create new game
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Soft delete game (deactivate)

### Game Sessions
- `GET /api/sessions` - Get all game sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create new game session
- `PUT /api/sessions/:id` - Update game session
- `DELETE /api/sessions/:id` - Delete game session

### Statistics
- `GET /api/stats/leaderboard/overall` - Overall leaderboard
- `GET /api/stats/leaderboard/game/:gameId` - Game-specific leaderboard
- `GET /api/stats/player/:playerId` - Player statistics
- `POST /api/stats/recalculate/:playerId` - Recalculate player stats
- `POST /api/stats/recalculate-all` - Recalculate all stats

## Database Schema

### Player
```typescript
{
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
}
```

### GameDefinition
```typescript
{
  name: string;
  scoringMode: 'pointing' | 'winner-takes-all';
  pointsPerPlayer: number;  // 5 for pointing, 3 for winner-takes-all
  isActive: boolean;
}
```

### GameSession
```typescript
{
  gameId: ObjectId;
  gameName: string;
  scoringMode: 'pointing' | 'winner-takes-all';
  playerCount: number;
  playedAt: Date;
  results: [{
    playerId: ObjectId;
    playerName: string;
    rank: number;
    score?: number;
    pointsEarned: number;
  }];
  totalPointsPool: number;
}
```

### PlayerStats (Cached)
```typescript
{
  playerId: ObjectId;
  playerName: string;
  overall: {
    totalGames: number;
    totalPoints: number;
    averagePoints: number;
    wins: number;
    podiums: number;
    winRate: number;
  };
  gameStats: [...]; // Per-game statistics
}
```

## Deployment to Render.com

1. **Set up MongoDB Atlas**
   - Create free cluster
   - Create database user
   - Whitelist all IPs (0.0.0.0/0)
   - Get connection string

2. **Deploy to Render**
   - Connect GitHub repository
   - Create new Web Service
   - Build command: `npm run build`
   - Start command: `npm start`
   - Add environment variable: `MONGODB_URI`
   - Add environment variable: `NODE_ENV=production`

3. **The server will**:
   - Build the Vite frontend to `server/dist/public`
   - Serve the frontend as static files
   - Handle API requests at `/api/*`

## How It Works (Single Instance)

In **development**:
- Vite dev server runs on port 5173
- Express API runs on port 3000
- Vite proxies `/api` requests to Express

In **production**:
- Express serves built Vite app from `dist/public`
- Express handles API routes at `/api/*`
- Single Node.js process handles everything

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
