import { useEffect, useRef } from 'react';

/**
 * Polls a callback function every `intervalMs` milliseconds.
 * Cleans up interval on component unmount.
 *
 * @param {Function} callback - async function to call on each tick
 * @param {number}   intervalMs - polling interval (default: 30000ms)
 * @param {boolean}  enabled - set to false to pause polling
 */
export function useOccupancyPoller(callback, intervalMs = 30000, enabled = true) {
  const savedCallback = useRef(callback);

  // Keep ref updated so stale closures don't matter
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Fire immediately on mount
    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}