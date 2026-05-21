import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';
const COOKIE = 'rt';
const MAX_AGE = 60 * 60 * 24 * 30;

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get(COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  // Refresh tokens using the httpOnly cookie
  let tokens: { access_token: string; refresh_token: string };
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    const body = (await res.json()) as { data: typeof tokens };
    tokens = body.data;
  } catch {
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 });
  }

  // Decode JWT payload to get roles and region_slug (already computed by backend)
  const payload = decodeJwt(tokens.access_token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const roles = Array.isArray(payload['roles']) ? (payload['roles'] as string[]) : [];
  const tenantId = typeof payload['tenantId'] === 'string' ? payload['tenantId'] : null;
  const tenantSlug = typeof payload['tenant_slug'] === 'string' ? payload['tenant_slug'] : null;
  const regionSlug = typeof payload['region_slug'] === 'string' ? payload['region_slug'] : null;

  // Get firstName, lastName, avatarUrl from /auth/me
  let profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  try {
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 401 });
    }
    const meBody = (await meRes.json()) as { data: typeof profile };
    profile = meBody.data;
  } catch {
    return NextResponse.json({ error: 'Auth service unavailable' }, { status: 503 });
  }

  const response = NextResponse.json({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    user: {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      tenantId,
      tenantSlug,
      roles,
      regionSlug,
      avatarUrl: profile.avatarUrl ?? null,
    },
  });

  // Rotate the refresh cookie with the new token
  response.cookies.set(COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  return response;
}
