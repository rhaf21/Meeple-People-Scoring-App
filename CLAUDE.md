# Claude Code Development Guidelines

This document outlines critical workflows and best practices when working on this project with Claude Code.

## Critical Workflows

### TypeScript Type Checking

**IMPORTANT**: After every file edit, especially TypeScript files, you MUST verify type safety.

#### Workflow for File Edits:

1. **After editing any `.ts` or `.tsx` file**, run TypeScript compiler to check for errors:

   ```bash
   # For server files
   cd server && npx tsc --noEmit

   # For client files
   cd client && npx tsc --noEmit

   # For both
   cd server && npx tsc --noEmit && cd ../client && npx tsc --noEmit
   ```

2. **Fix all type errors** before proceeding to the next task

3. **Document any intentional type suppressions** (e.g., `@ts-ignore`, `any`) with clear comments explaining why

#### Type Safety Checklist:

- [ ] All function parameters have explicit types
- [ ] All function return types are defined
- [ ] No usage of `any` without justification
- [ ] Mongoose models have proper TypeScript interfaces
- [ ] API request/response types are defined
- [ ] React component props have defined interfaces

### Running the Application

#### Development Mode:

```bash
# Root directory - runs both client and server
npm run dev
```

This starts:
- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:3000`

#### Testing Backend Only:

```bash
cd server
npm run dev
```

#### Testing Frontend Only:

```bash
cd client
npm run dev
```

### Database Operations

#### Seed Database:

```bash
cd server
npm run seed
```

#### Connect to MongoDB:

Ensure `.env` file has correct `MONGODB_URI`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scoring-app?retryWrites=true&w=majority
```

### Testing Endpoints

Use tools like:
- **Thunder Client** (VS Code extension)
- **Postman**
- **curl**

Example endpoints:
```bash
# Get all players
curl http://localhost:3000/api/players

# Create a player
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'

# Get all games
curl http://localhost:3000/api/games

# Get overall leaderboard
curl http://localhost:3000/api/stats/leaderboard/overall
```

## Project Structure Understanding

### Backend (`server/src/`)

- **`models/`** - Mongoose schemas with TypeScript interfaces
- **`routes/`** - Express route handlers (API endpoints)
- **`services/`** - Business logic (scoring, stats calculations)
- **`utils/`** - Helper functions (database connection, seed data)

### Frontend (`client/src/`)

- **`pages/`** - Page components (Dashboard, Players, Games, etc.)
- **`components/`** - Reusable React components
- **`hooks/`** - Custom React hooks
- **`lib/`** - Utilities and API client functions
- **`types/`** - TypeScript type definitions

## Common Issues and Solutions

### MongoDB Connection Issues

**Error**: `MongoServerError: bad auth : authentication failed`

**Solutions**:
1. Check MongoDB Atlas → Network Access → Whitelist IP (0.0.0.0/0 for dev)
2. Verify Database Access → User has correct permissions
3. Check `.env` file for correct credentials

### Type Errors

**Error**: `Property 'X' does not exist on type 'Y'`

**Solutions**:
1. Check if the interface/type is properly imported
2. Verify the Mongoose model has matching TypeScript interface
3. Ensure the type definition matches the actual data structure

### Import Path Issues

**Error**: `Cannot find module './X.js'`

**Solutions**:
1. TypeScript files use `.js` extension in imports (for ES modules)
2. Check `tsconfig.json` has `"moduleResolution": "node"` or `"bundler"`
3. Verify the file exists and path is correct

## Code Quality Standards

### TypeScript

- **Strict mode enabled**: All strict TypeScript checks must pass
- **No implicit any**: Every variable/parameter must have a type
- **Interface over type**: Prefer `interface` for object shapes
- **Readonly where applicable**: Use `readonly` for immutable properties

### Express Routes

- **Error handling**: Every route must have try-catch
- **Validation**: Validate request body/params before processing
- **Consistent responses**: Use consistent JSON structure

  ```typescript
  // Success
  res.json({ data: result })

  // Error
  res.status(400).json({ error: 'Error message' })
  ```

### React Components

- **Functional components**: No class components
- **TypeScript props**: All props must have defined interfaces
- **Hooks**: Use hooks for state and side effects
- **Error boundaries**: Wrap components in error boundaries

## Before Committing

1. [ ] Run TypeScript type check: `npx tsc --noEmit`
2. [ ] Run linter: `npm run lint` (if configured)
3. [ ] Test all modified endpoints
4. [ ] Verify frontend compiles: `cd client && npm run build`
5. [ ] Verify backend compiles: `cd server && npm run build`
6. [ ] Update documentation if API changes
7. [ ] Test in development mode: `npm run dev`

## Deployment Checklist

1. [ ] All TypeScript errors resolved
2. [ ] Environment variables documented in `.env.example`
3. [ ] Build succeeds: `npm run build`
4. [ ] Database migrations complete (if any)
5. [ ] MongoDB Atlas configured correctly
6. [ ] Render.com environment variables set
7. [ ] Test production build locally: `npm start`

## Emergency Rollback

If deployment fails:

1. Check Render.com logs for errors
2. Verify environment variables are set correctly
3. Check MongoDB Atlas connection string
4. Roll back to previous deployment in Render dashboard
5. Fix issues locally and redeploy

## Monitoring

### Key Metrics to Watch:

- Response times (API endpoints)
- Error rates (500 errors)
- Database connection pool usage
- Memory usage on Render.com

### Logs:

```bash
# Development
# Logs appear in console where npm run dev is running

# Production (Render.com)
# Check Render dashboard → Logs tab
```

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Remember**: Type safety is critical. Never skip the typecheck step after editing files.
