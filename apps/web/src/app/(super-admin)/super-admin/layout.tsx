'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  Map,
  Puzzle,
  UserCog,
  LogOut,
  Shield,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

// ── Static region list (seed data from REGIONS.md) ────────────────────────────

const FLAG: Record<string, string> = {
  SN: '🇸🇳',
  CI: '🇨🇮',
  MA: '🇲🇦',
  FR: '🇫🇷',
};

const REGION_NAV = [
  { slug: 'dakar', name: 'Dakar', country_code: 'SN' },
  { slug: 'thies', name: 'Thiès', country_code: 'SN' },
  { slug: 'saint-louis', name: 'Saint-Louis', country_code: 'SN' },
  { slug: 'abidjan', name: 'Abidjan', country_code: 'CI' },
  { slug: 'casablanca', name: 'Casablanca', country_code: 'MA' },
  { slug: 'paris', name: 'Paris', country_code: 'FR' },
] as const;

const SUPER_ADMIN_NAV = [
  { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard, exact: true },
  { label: 'Demandes', href: '/super-admin/requests', icon: ClipboardList, exact: false },
  { label: 'Tenants', href: '/super-admin/tenants', icon: Store, exact: false },
  { label: 'Modules', href: '/super-admin/modules', icon: Puzzle, exact: false },
  { label: 'Admins', href: '/super-admin/admins', icon: UserCog, exact: false },
] as const;

const REGION_SUBNAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '' },
  { label: 'Demandes', icon: ClipboardList, path: '/requests' },
  { label: 'Tenants', icon: Store, path: '/tenants' },
] as const;

// ── NavItem ────────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
        ${
          active
            ? 'bg-violet-500/20 text-white border-l-[3px] border-violet-400 pl-[calc(0.75rem-3px)]'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
        }`}
    >
      <Icon size={17} className={active ? 'text-violet-400' : 'text-current'} />
      <span>{label}</span>
    </Link>
  );
}

// ── RegionSubNav ───────────────────────────────────────────────────────────────

function RegionSubNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/super-admin/regions/${slug}`;

  return (
    <div className="mt-0.5 ml-3 border-l border-white/10 pl-3 space-y-0.5">
      {REGION_SUBNAV.map(({ label, icon: Icon, path }) => {
        const href = `${base}${path}`;
        const active = path === '' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-all
              ${
                active
                  ? 'bg-violet-500/20 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
          >
            <Icon size={14} className={active ? 'text-violet-400' : 'text-current'} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

// ── RegionsSection ─────────────────────────────────────────────────────────────

function RegionsSection({
  isSuperAdmin,
  userRegionSlug,
}: {
  isSuperAdmin: boolean;
  userRegionSlug: string | null | undefined;
}) {
  const pathname = usePathname();

  const regionMatch = pathname.match(/^\/super-admin\/regions\/([^/]+)(\/|$)/);
  const activeSlug = regionMatch?.[1] ?? null;

  const visibleRegions = isSuperAdmin
    ? REGION_NAV
    : REGION_NAV.filter((r) => r.slug === userRegionSlug);

  const regionsHref = '/super-admin/regions';
  const regionsActive = pathname.startsWith('/super-admin/regions');

  return (
    <div>
      {isSuperAdmin && (
        <Link
          href={regionsHref}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
            ${
              regionsActive && !regionMatch
                ? 'bg-violet-500/20 text-white border-l-[3px] border-violet-400 pl-[calc(0.75rem-3px)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
            }`}
        >
          <Map size={17} className={regionsActive && !regionMatch ? 'text-violet-400' : 'text-current'} />
          <span>Régions</span>
        </Link>
      )}

      {!isSuperAdmin && (
        <p className="px-3 py-1.5 text-[10px] text-slate-600 uppercase tracking-widest font-medium">
          Ma région
        </p>
      )}

      {regionMatch && (
        <div className="mt-0.5 space-y-0.5">
          {visibleRegions.map((r) => {
            const isExpanded = r.slug === activeSlug;
            return (
              <div key={r.slug}>
                <Link
                  href={`/super-admin/regions/${r.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all border-l-[3px]
                    ${
                      isExpanded
                        ? 'border-violet-400 pl-[calc(0.75rem-3px)] text-slate-200 bg-white/5'
                        : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                    }`}
                >
                  <span>{FLAG[r.country_code] ?? '🌍'}</span>
                  <span className="font-medium">{r.name}</span>
                </Link>
                {isExpanded && <RegionSubNav slug={r.slug} />}
              </div>
            );
          })}
        </div>
      )}

      {!regionMatch && !isSuperAdmin && (
        <div className="mt-0.5 space-y-0.5">
          {visibleRegions.map((r) => (
            <Link
              key={r.slug}
              href={`/super-admin/regions/${r.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all border-l-[3px] border-transparent"
            >
              <span>{FLAG[r.country_code] ?? '🌍'}</span>
              <span className="font-medium">{r.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = user?.roles.includes('super_admin') ?? false;
  const isRegionalAdmin = user?.roles.includes('regional_admin') ?? false;

  return (
    <div className="flex flex-col h-full w-[240px] bg-slate-950 flex-shrink-0">
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <Link href="/super-admin" className="flex items-center gap-2">
            <Shield size={16} className="text-violet-400" />
            <span className="font-heading font-bold text-white text-sm tracking-tight">
              TÉRANGATABLE
            </span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {isSuperAdmin && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-red-600 text-white uppercase">
            SUPER ADMIN
          </span>
        )}
        {isRegionalAdmin && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-violet-700 text-white uppercase">
            ADMIN RÉGIONAL
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {isSuperAdmin &&
          SUPER_ADMIN_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

        <RegionsSection
          isSuperAdmin={isSuperAdmin}
          userRegionSlug={user?.regionSlug}
        />
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="px-3 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <p className="text-[10px] text-violet-300 font-medium uppercase tracking-wide">
            Connecté en tant que
          </p>
          <p className="text-xs text-white font-semibold mt-0.5">
            {isSuperAdmin ? 'Super Admin' : 'Admin Régional'}
          </p>
          {user && (
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.email}</p>
          )}
        </div>
        <button
          onClick={() => void logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors text-sm"
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────────────────

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  // Build breadcrumb: map slugs to readable labels
  const REGION_NAME: Record<string, string> = {
    dakar: 'Dakar',
    thies: 'Thiès',
    'saint-louis': 'Saint-Louis',
    abidjan: 'Abidjan',
    casablanca: 'Casablanca',
    paris: 'Paris',
  };

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .slice(1) // skip 'super-admin'
    .map((seg) => REGION_NAME[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '));

  return (
    <header className="sticky top-0 z-30 h-14 bg-slate-950/80 backdrop-blur border-b border-white/10 flex items-center px-4 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <nav className="flex items-center gap-1.5 text-sm font-body">
        <span className="text-slate-500">Super Admin</span>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight size={13} className="text-slate-600" />
            <span
              className={
                i === segments.length - 1
                  ? 'text-white font-semibold'
                  : 'text-slate-500'
              }
            >
              {seg}
            </span>
          </span>
        ))}
      </nav>
    </header>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full w-[240px] bg-slate-950 flex-shrink-0 animate-pulse">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="h-4 w-32 bg-white/10 rounded mb-3" />
        <div className="h-4 w-20 bg-white/5 rounded" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-white/5 rounded-lg" />
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

interface SessionResponse {
  access_token: string;
  refresh_token: string;
  user: import('@/stores/auth.store').AuthUser;
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const pathname = usePathname();
  const cookieRestoreAttempted = useRef(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  // Restore session: sessionStorage is the fast path; cookie-based refresh is
  // the fallback for new tabs where sessionStorage is empty but the rt cookie exists.
  // This call only happens inside the protected super-admin layout, never on /login.
  useEffect(() => {
    if (isAuthenticated) {
      setSessionReady(true);
      return;
    }
    if (cookieRestoreAttempted.current) return;
    cookieRestoreAttempted.current = true;

    void (async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const body = (await res.json()) as SessionResponse;
          setTokens(body.access_token, body.refresh_token);
          setUser(body.user);
        }
      } finally {
        // Whether it succeeded or failed, stop showing the skeleton
        setSessionReady(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        {sessionReady ? <Sidebar /> : <SidebarSkeleton />}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full flex">
            {sessionReady ? (
              <Sidebar onClose={() => setMobileOpen(false)} />
            ) : (
              <SidebarSkeleton />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
