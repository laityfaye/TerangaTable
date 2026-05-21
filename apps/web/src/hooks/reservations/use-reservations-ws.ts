'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { RESERVATIONS_QKEY, Reservation, ReservationsResponse } from './use-reservations';

const SOCKET_URL =
  (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1').replace(/\/v1$/, '');

export function useReservationsWs() {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
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
      setConnected(true);
      socket.emit('join:tenant', { tenantId, token: accessToken });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('reservation:created', (reservation: Reservation) => {
      const queries = qc.getQueriesData<ReservationsResponse>({ queryKey: ['reservations'] });
      for (const [key, cached] of queries) {
        if (!cached || !Array.isArray(cached.data)) continue;
        qc.setQueryData(key, {
          ...cached,
          data: [reservation, ...cached.data],
          meta: { ...cached.meta, total: cached.meta.total + 1 },
        });
      }
    });

    socket.on('reservation:updated', (reservation: Reservation) => {
      qc.setQueryData(RESERVATIONS_QKEY.detail(reservation.id), reservation);
      const queries = qc.getQueriesData<ReservationsResponse>({ queryKey: ['reservations'] });
      for (const [key, cached] of queries) {
        if (!cached || !Array.isArray(cached.data)) continue;
        qc.setQueryData(key, {
          ...cached,
          data: cached.data.map((r) => (r.id === reservation.id ? reservation : r)),
        });
      }
    });

    return () => {
      socket.emit('leave:tenant', { tenantId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [tenantId, accessToken, qc]);

  return { connected };
}
