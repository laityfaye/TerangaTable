import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_DOMAIN = process.env['PLATFORM_DOMAIN'] ?? 'terangatable.com';
const REFRESH_COOKIE = 'rt';

const PUBLIC_PATHS = ['/_next', '/favicon.ico', '/api/'];
const AUTH_PATHS = ['/login', '/forgot-password', '/reset-password'];
const PROTECTED_PATHS = ['/dashboard'];
const SUPER_ADMIN_PATHS = ['/super-admin'];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpired(payload: Record<string, unknown>): boolean {
  const exp = payload['exp'];
  if (typeof exp !== 'number') return false;
  return Date.now() / 1000 > exp;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and API routes — pass through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Redirect www → apex domain
  const host = req.headers.get('host') ?? '';
  if (host.startsWith('www.')) {
    const apex = host.slice(4);
    const url = req.nextUrl.clone();
    url.host = apex;
    return NextResponse.redirect(url, 308);
  }

  // Tenant subdomain detection — attach slug header
  const withoutPort = host.split(':')[0] ?? '';
  if (withoutPort.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const slug = withoutPort.slice(0, -(PLATFORM_DOMAIN.length + 1));
    if (slug && slug !== 'app' && slug !== 'api') {
      const res = NextResponse.next();
      res.headers.set('x-tenant-slug', slug);
      return res;
    }
  }

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const payload = refreshToken ? decodeJwtPayload(refreshToken) : null;
  const isAuthenticated = !!payload && !isExpired(payload);
  const roles = Array.isArray(payload?.['roles'])
    ? (payload['roles'] as string[])
    : [];
  const regionSlug =
    typeof payload?.['region_slug'] === 'string' ? payload['region_slug'] : null;

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated) {
      if (roles.includes('super_admin')) {
        return NextResponse.redirect(new URL('/super-admin', req.url));
      }
      if (roles.includes('regional_admin') && regionSlug) {
        return NextResponse.redirect(
          new URL(`/super-admin/regions/${regionSlug}`, req.url),
        );
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Redirect root to the right home depending on role
  if (pathname === '/') {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/login', req.url));
    if (roles.includes('super_admin')) return NextResponse.redirect(new URL('/super-admin', req.url));
    if (roles.includes('regional_admin') && regionSlug) {
      return NextResponse.redirect(new URL(`/super-admin/regions/${regionSlug}`, req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect /super-admin/*
  if (SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (roles.includes('super_admin')) {
      return NextResponse.next();
    }
    if (roles.includes('regional_admin') && regionSlug) {
      const regionMatch = pathname.match(/^\/super-admin\/regions\/([^/]+)(\/|$)/);
      if (regionMatch && regionMatch[1] === regionSlug) {
        return NextResponse.next();
      }
      return NextResponse.redirect(
        new URL(`/super-admin/regions/${regionSlug}`, req.url),
      );
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect /dashboard/*
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|robots\\.txt|sitemap\\.xml).*)'],
};
