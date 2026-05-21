'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { NOTIFS_QKEY, AppNotification, NotificationsResponse } from './use-notifications';

const SOCKET_URL = (
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1'
).replace(/\/v1$/, '');

export function useNotificationsWs() {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useAuthStore((s) => s.tenantId);

  useEffect(() => {
    if (!tenantId || !accessToken) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:tenant', { tenantId, token: accessToken });
    });

    socket.on('notification:new', (notif: AppNotification) => {
      qc.setQueryData<NotificationsResponse>(NOTIFS_QKEY.all, (prev) => {
        if (!prev) return { data: [notif], unread_count: 1 };
        return {
          data: [notif, ...prev.data.slice(0, 49)],
          unread_count: prev.unread_count + 1,
        };
      });
    });

    return () => {
      socket.emit('leave:tenant', { tenantId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tenantId, accessToken, qc]);
}
