/**
 * useMockSync — subscribes to both:
 *   'domrs:update'  (same-tab mutations)
 *   'storage'       (cross-tab localStorage changes)
 *
 * Call this in any component that needs to stay in sync with MOCK_STATE
 * regardless of which tab triggered the change.
 *
 * Usage:
 *   useMockSync(load);
 */
'use client';
import { useEffect, useRef } from 'react';
import { loadFromStorage } from '@/services/mockData';

export function useMockSync(load: () => void) {
  // Keep a ref to always invoke the latest version of load so that
  // re-renders that produce a new function reference don't leave stale
  // closures inside the event listeners.
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    // Initial load
    loadRef.current();

    const handleUpdate = () => loadRef.current();

    // Same-tab: fired directly by emitUpdate()
    window.addEventListener('domrs:update', handleUpdate);

    // Cross-tab (same browser): fired when another tab writes to localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'domrs_state_v2') {
        loadFromStorage(); // merge localStorage → MOCK_STATE
        loadRef.current(); // re-read from updated MOCK_STATE
      }
    };
    window.addEventListener('storage', onStorage);

    // Cross-device fallback: poll every 2 s so that changes made on a
    // different browser / device (phone ↔ PC) are never missed.
    const poll = setInterval(() => {
      const changed = loadFromStorage(); // returns true when data changed
      if (changed) loadRef.current();
    }, 2000);

    return () => {
      window.removeEventListener('domrs:update', handleUpdate);
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
    };
  }, []); // intentionally empty — loadRef handles freshness
}
