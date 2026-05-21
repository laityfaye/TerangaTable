'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Monitor,
  CalendarDays,
  UtensilsCrossed,
  Users,
  CreditCard,
  BarChart3,
  Globe,
  Truck,
  Settings,
  Search,
  ChevronRight,
  LogOut,
  X,
  Menu,
  UserCog,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@terangatable/shared';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { prefetchRoute } from '@/lib/prefetch';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // undefined = tous les rôles autorisés
}

interface NavGroup {
  title: string;
  items: NavItem[];
  roles?: string[]; // masque tout le groupe si aucun rôle ne correspond
}

const ALL_TENANT_ROLES = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVEUR,
  UserRole.CAISSIER,
  UserRole.CUISINIER,
  UserRole.LIVREUR,
];

const OWNER_MANAGER = [UserRole.OWNER, UserRole.MANAGER];

const NAV: NavGroup[] = [
  {
    title: 'OPÉRATIONS',
    items: [
      {
        label: 'Tableau de bord',
        href: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        roles: OWNER_MANAGER,
      },
      {
        label: 'Commandes',
        href: '/dashboard/orders',
        icon: <ShoppingCart size={18} />,
        roles: ALL_TENANT_ROLES,
      },
      {
        label: 'Caisse (POS)',
        href: '/dashboard/pos',
        icon: <Monitor size={18} />,
        roles: [...OWNER_MANAGER, UserRole.CAISSIER],
      },
      {
        label: 'Réservations',
        href: '/dashboard/reservations',
        icon: <CalendarDays size={18} />,
        roles: [...OWNER_MANAGER, UserRole.SERVEUR],
      },
    ],
  },
  {
    title: 'MENU',
    items: [
      {
        label: 'Menu',
        href: '/dashboard/menu',
        icon: <UtensilsCrossed size={18} />,
        roles: OWNER_MANAGER,
      },
    ],
    roles: OWNER_MANAGER,
  },
  {
    title: 'CLIENTS',
    items: [
      {
        label: 'Clients',
        href: '/dashboard/customers',
        icon: <Users size={18} />,
        roles: OWNER_MANAGER,
      },
    ],
    roles: OWNER_MANAGER,
  },
  {
    title: 'FINANCES',
    items: [
      {
        label: 'Paiements',
        href: '/dashboard/payments',
        icon: <CreditCard size={18} />,
        roles: [...OWNER_MANAGER, UserRole.CAISSIER],
      },
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: <BarChart3 size={18} />,
        roles: OWNER_MANAGER,
      },
    ],
    roles: [...OWNER_MANAGER, UserRole.CAISSIER],
  },
  {
    title: 'VITRINE',
    items: [
      {
        label: 'Mon Site',
        href: '/dashboard/website',
        icon: <Globe size={18} />,
        roles: OWNER_MANAGER,
      },
    ],
    roles: OWNER_MANAGER,
  },
  {
    title: 'LIVRAISON',
    items: [
      {
        label: 'Livraison',
        href: '/dashboard/delivery',
        icon: <Truck size={18} />,
        roles: [...OWNER_MANAGER, UserRole.LIVREUR],
      },
    ],
    roles: [...OWNER_MANAGER, UserRole.LIVREUR],
  },
  {
    title: 'PARAMÈTRES',
    items: [
      {
        label: 'Réglages',
        href: '/dashboard/settings',
        icon: <Settings size={18} />,
        roles: OWNER_MANAGER,
      },
      {
        label: 'Équipe',
        href: '/dashboard/settings/users',
        icon: <UserCog size={18} />,
        roles: OWNER_MANAGER,
      },
    ],
    roles: OWNER_MANAGER,
  },
];

const ROLE_LABELS: Record<string, string> = {
  [UserRole.OWNER]: 'Propriétaire',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.SERVEUR]: 'Serveur',
  [UserRole.CAISSIER]: 'Caissier',
  [UserRole.CUISINIER]: 'Cuisinier',
  [UserRole.LIVREUR]: 'Livreur',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.REGIONAL_ADMIN]: 'Admin Régional',
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const qc = useQueryClient();
  return (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={() => prefetchRoute(item.href, qc)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all
        ${active
          ? 'bg-terracotta/15 text-white border-l-[3px] border-terracotta pl-[calc(0.75rem-3px)]'
          : 'text-white/60 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
        }`}
    >
      <span className={active ? 'text-terracotta' : 'text-current'}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const userRoles = user?.roles ?? [];

  const hasAccess = (roles?: string[]) => {
    if (!roles) return true;
    return roles.some((r) => userRoles.includes(r));
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
  const primaryRole = userRoles[0] ?? 'manager';

  return (
    <div className="flex flex-col h-full w-[260px] bg-[#1A1A18] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="text-xl">🍽️</span>
          <span className="font-heading font-bold text-white text-base tracking-tight">
            TÉRANGATABLE
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Restaurant info */}
      <div className="px-5 py-3 border-b border-white/10">
        <p className="text-white text-sm font-medium truncate">{fullName}</p>
        <p className="text-white/40 text-xs mt-0.5 capitalize">
          {ROLE_LABELS[primaryRole] ?? primaryRole}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.filter((group) => hasAccess(group.roles)).map((group) => {
          const visibleItems = group.items.filter((item) => hasAccess(item.roles));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="text-white/30 text-[10px] font-semibold tracking-widest px-3 mb-1.5">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href)} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{fullName}</p>
            <p className="text-white/40 text-xs capitalize">
              {ROLE_LABELS[primaryRole] ?? primaryRole}
            </p>
          </div>
          <button
            onClick={() => void logout()}
            className="text-white/40 hover:text-red-400 transition-colors"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: '/' + seg,
    }));

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E7E5E4] flex items-center px-4 gap-4 shadow-sm">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-[#1C1917] transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm font-body flex-1 min-w-0">
        {segments.map((seg, i) => (
          <span key={seg.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
            <span
              className={
                i === segments.length - 1
                  ? 'font-semibold text-[#1C1917] truncate'
                  : 'text-slate-400'
              }
            >
              {seg.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Global search (placeholder) */}
        <button
          className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-md border border-[#E7E5E4] text-slate-400 text-xs hover:border-slate-300 transition-colors"
          aria-label="Recherche globale"
        >
          <Search size={13} />
          <span>Rechercher</span>
          <kbd className="ml-1 text-[10px] bg-[#F5F4F2] px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>

        {/* Notifications */}
        <NotificationsBell />
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const pathname = usePathname();
  useEffect(() => setMobileOpen(false), [pathname]);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFAF8] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full flex">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
