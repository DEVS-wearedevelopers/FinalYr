'use client';
/**
 * useHttpSync — polls the render.com backend every 1.5s for state updates.
 * Also registers this device's presence so EOC can show "Live Devices".
 *
 * Works on the phone because NEXT_PUBLIC_API_URL is already on Vercel.
 * No Supabase env vars needed.
 */
import { useEffect } from 'react';
import { pollBackend } from '@/services/httpSync';

export function useHttpSync(load: () => void, role = 'unknown', user = 'User') {
  useEffect(() => {
    // Immediate first poll
    pollBackend(role, user, load);

    // Then every 1.5 seconds
    const id = setInterval(() => pollBackend(role, user, load), 1500);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
