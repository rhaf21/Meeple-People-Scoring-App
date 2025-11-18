# Claude Code Development Guidelines

This document outlines critical workflows and best practices when working on this project with Claude Code.

## Critical Workflows

### Authentication & Authorization

**⚠️ CRITICAL**: Every API endpoint MUST have proper authentication/authorization implemented BEFORE writing business logic.

#### When Creating New API Endpoints:

**ALWAYS follow this order:**
1. **Determine auth level FIRST** (public, user, admin)
2. **Add middleware at the TOP** of your endpoint function
3. **Write business logic AFTER** auth is verified
4. **Test with proper auth headers**

#### Authentication Middleware Reference:

```typescript
// ✅ ADMIN-ONLY ENDPOINT (settings, user management, etc.)
import { requireAdmin } from '@/lib/middleware/authMiddleware';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult; // user.role === 'admin'

  // ... business logic here
}

// ✅ USER ENDPOINT (user or admin can access)
import { requireUser } from '@/lib/middleware/authMiddleware';

export async function PATCH(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult; // user.role === 'user' or 'admin'

  // ... business logic here
}

// ✅ AUTHENTICATED ENDPOINT (any logged-in user)
import { requireAuth } from '@/lib/middleware/authMiddleware';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  // ... business logic here
}

// ✅ PUBLIC ENDPOINT (explicitly document as public)
export async function GET(request: NextRequest) {
  // PUBLIC ENDPOINT - No authentication required
  // Used for: leaderboards, public stats, etc.

  // ... business logic here
}
```

#### Testing Authenticated Endpoints:

**Step 1: Get JWT Token**
```bash
# Send OTP to email
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email@example.com"}'

# Verify OTP and get token
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin-email@example.com","otp":"123456"}'

# Response will include: { "token": "eyJhbGc...", ... }
# SAVE THIS TOKEN!
```

**Step 2: Use Token in Requests**
```bash
# Test admin settings endpoint (GET - public)
curl http://localhost:3000/api/admin/settings

# Test admin settings update (PATCH - requires admin)
curl -X PATCH http://localhost:3000/api/admin/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"siteTitle":"My Custom Title","primaryColor":"#ff0000"}'

# Test admin file upload (POST - requires admin)
curl -X POST http://localhost:3000/api/admin/settings/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "file=@/path/to/logo.png" \
  -F "type=logo"

# Test admin file delete (DELETE - requires admin)
curl -X DELETE "http://localhost:3000/api/admin/settings/upload?type=logo" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Using Postman/Thunder Client:**
1. Create request
2. Go to "Auth" or "Headers" tab
3. Add header: `Authorization` with value: `Bearer YOUR_JWT_TOKEN_HERE`
4. Send request

#### Authorization Checklist:

**Before creating any new endpoint:**
- [ ] Determine required auth level (public, user, or admin)
- [ ] Import appropriate middleware (`requireAuth`, `requireUser`, or `requireAdmin`)
- [ ] Add auth check at the VERY START of the function (before any business logic)
- [ ] Handle the auth result (return if NextResponse, use user data if success)
- [ ] Test endpoint WITHOUT auth header (should get 401/403 error)
- [ ] Test endpoint WITH valid auth header (should succeed)
- [ ] Test endpoint with WRONG auth level (user trying to access admin endpoint)
- [ ] Document auth requirements in code comments
- [ ] Add example curl commands to this file if introducing new patterns

#### Common Auth Errors:

**Error: "Unauthorized - No token provided"**
- Missing `Authorization` header
- Header doesn't start with `Bearer `
- Solution: Add `Authorization: Bearer YOUR_TOKEN` header

**Error: "Unauthorized - Invalid token"**
- Token is expired (7 day expiry)
- Token is malformed
- Solution: Get a new token via `/api/auth/verify-otp`

**Error: "Forbidden - Admin access required"**
- User is authenticated but not an admin
- Solution: Use an admin account or change endpoint to `requireUser`

**Error: "Forbidden - User access required"**
- User has 'guest' role
- Solution: User needs to claim their profile to get 'user' role

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
2. [ ] **Test all modified endpoints with proper authentication headers**
3. [ ] Verify auth requirements are documented in endpoint comments
4. [ ] Run linter: `npm run lint` (if configured)
5. [ ] Verify frontend compiles: `cd client && npm run build`
6. [ ] Verify backend compiles: `cd server && npm run build`
7. [ ] **📝 Update changelog page (`app/changelog/page.tsx`) with all changes made**
8. [ ] Update documentation if API changes
9. [ ] Update CLAUDE.md with new curl examples if new auth patterns introduced
10. [ ] Test in development mode: `npm run dev`

### Changelog Documentation

**⚠️ CRITICAL**: Every change MUST be documented in the changelog page before committing.

- **Location**: `app/changelog/page.tsx`
- **Access**: Version badge in navigation or `/changelog` URL
- **Categories**:
  - ✨ New Features (new functionality added)
  - 🔧 Improvements (enhancements to existing features)
  - 🐛 Bug Fixes (fixes to broken functionality)
  - 📱 Responsive Design (mobile/tablet layout improvements)
  - ♿ Accessibility (A11y improvements, ARIA labels, keyboard navigation)
- **Format**: Add changes to the latest version section, create new version if needed
- **Details**: Include file names in Technical Details section
- **Purpose**: Keep users informed and track project evolution

#### What to Document in Changelog

**REQUIRED - Document ALL changes**:
- ✨ **New Features**: Any new functionality, buttons, links, pages, components, modals
- 🔧 **Improvements**: UI/UX fixes, spacing adjustments, layout improvements, performance enhancements, padding/margin changes
- 🐛 **Bug Fixes**: Any fixes to broken functionality, errors, unexpected behavior, TypeScript errors
- 📱 **Responsive Design**: Mobile/tablet layout improvements, breakpoint adjustments
- ♿ **Accessibility**: A11y improvements, ARIA labels, keyboard navigation, screen reader support

#### Examples of Changes That MUST Be Documented

**YES - Document these**:
- ✅ Adding a "View All" link → Document as improvement
- ✅ Fixing button padding or spacing → Document as UI improvement
- ✅ Adjusting gaps between elements → Document as UX improvement
- ✅ Fixing alignment issues → Document as UI fix
- ✅ Changing dropdown arrow styling → Document as improvement
- ✅ Any visual changes users can see → Document it!
- ✅ Adding confirmation dialogs → Document as improvement
- ✅ Changing filter from tabs to dropdown → Document as improvement

**NO - Don't document these**:
- ❌ Internal refactoring with no user-facing changes
- ❌ Code comments updates (unless they affect documentation)
- ❌ Dependency updates (unless they add new features)

#### Rule of Thumb
**If you changed code that affects what the user sees or experiences, it goes in the changelog. No exceptions.**

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
