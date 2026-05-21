'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ShoppingCart,
  CreditCard,
  CalendarDays,
  Info,
  RefreshCw,
  CheckCheck,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/notifications/use-notifications';
import { useNotificationsWs } from '@/hooks/notifications/use-notifications-ws';
import type { AppNotification } from '@/hooks/notifications/use-notifications';

// ── Type → icon mapping ────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order_created: <ShoppingCart size={15} />,
  order_state_changed: <RefreshCw size={15} />,
  payment: <CreditCard size={15} />,
  reservation: <CalendarDays size={15} />,
};

function NotifIcon({ type }: { type: string }) {
  const icon = TYPE_ICONS[type] ?? <Info size={15} />;
  return (
    <div className="w-7 h-7 rounded-full bg-[#F5F4F2] flex items-center justify-center flex-shrink-0 text-slate-500">
      {icon}
    </div>
  );
}

// ── Single notification row ────────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
}) {
  const relativeTime = formatDistanceToNow(new Date(notif.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <button
      onClick={() => !notif.is_read && onRead(notif.id)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAF8] transition-colors ${
        !notif.is_read ? 'bg-[#FFF7F5]' : ''
      }`}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1C1917] leading-snug truncate">{notif.title}</p>
        {notif.body && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
        )}
        <p className="text-[11px] text-slate-400 mt-1">{relativeTime}</p>
      </div>
      {!notif.is_read && (
        <span className="w-2 h-2 rounded-full bg-terracotta flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}

// ── Bell with popover ──────────────────────────────────────────────────────────

export function NotificationsBell() {
  useNotificationsWs();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: marking } = useMarkAllRead();

  const notifications = data?.data.slice(0, 10) ?? [];
  const unreadCount = data?.unread_count ?? 0;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F5F4F2] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-terracotta rounded-full text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E7E5E4] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E5E4]">
            <span className="text-sm font-semibold text-[#1C1917]">
              Notifications{unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-terracotta">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={marking}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#1C1917] px-2 py-1 rounded hover:bg-[#F5F4F2] transition-colors disabled:opacity-50"
                >
                  <CheckCheck size={13} />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F5F4F2] text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-[#F5F4F2] max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotifRow key={notif.id} notif={notif} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E7E5E4] px-4 py-2.5">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-terracotta hover:underline font-medium"
            >
              Toutes les notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
