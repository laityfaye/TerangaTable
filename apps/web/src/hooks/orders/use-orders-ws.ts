'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { ORDERS_QKEY, Order, OrdersResponse, WorkflowStateSnap } from './use-orders';

const SOCKET_URL =
  (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1').replace(/\/v1$/, '');

function playPing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio not available
  }
}

export function useOrdersWs(soundEnabled = true) {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;
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

    socket.on('order:created', (order: Order) => {
      // Prepend to all list caches
      const queries = qc.getQueriesData<OrdersResponse>({ queryKey: ['orders'] });
      for (const [key, cached] of queries) {
        if (!cached || !Array.isArray(cached.data)) continue;
        qc.setQueryData(key, {
          ...cached,
          data: [order, ...cached.data],
          meta: { ...cached.meta, total: cached.meta.total + 1 },
        });
      }
      if (soundRef.current) playPing();
    });

    socket.on(
      'order:state_changed',
      (data: { orderId: string; workflowState: WorkflowStateSnap | null; updatedAt: string }) => {
        // Update workflow_state in all list caches
        const queries = qc.getQueriesData<OrdersResponse>({ queryKey: ['orders'] });
        for (const [key, cached] of queries) {
          if (!cached || !Array.isArray(cached.data)) continue;
          qc.setQueryData(key, {
            ...cached,
            data: cached.data.map((o) =>
              o.id === data.orderId
                ? { ...o, workflow_state: data.workflowState }
                : o,
            ),
          });
        }
        // Invalidate detail and transitions
        qc.invalidateQueries({ queryKey: ORDERS_QKEY.detail(data.orderId) });
        qc.invalidateQueries({ queryKey: ORDERS_QKEY.transitions(data.orderId) });
      },
    );

    socket.on('order:updated', (order: Order) => {
      // Update detail cache
      qc.setQueryData(ORDERS_QKEY.detail(order.id), order);
      // Update in list caches
      const queries = qc.getQueriesData<OrdersResponse>({ queryKey: ['orders'] });
      for (const [key, cached] of queries) {
        if (!cached || !Array.isArray(cached.data)) continue;
        qc.setQueryData(key, {
          ...cached,
          data: cached.data.map((o) => (o.id === order.id ? order : o)),
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
