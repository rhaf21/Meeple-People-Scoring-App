import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/utils/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token from Authorization header
 * Usage in API routes:
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request);
 *   if (authResult instanceof NextResponse) return authResult;
 *
 *   const user = authResult;
 *   // ... rest of your route logic
 * }
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload | NextResponse> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    return payload;
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }
}

/**
 * Optional auth middleware - doesn't fail if no token is provided
 * Returns user data if authenticated, null otherwise
 */
export async function optionalAuth(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if the authenticated user owns the resource
 * Returns true if user is the owner, false otherwise
 */
export function isResourceOwner(user: JWTPayload, resourceOwnerId: string): boolean {
  return user.playerId === resourceOwnerId;
}
