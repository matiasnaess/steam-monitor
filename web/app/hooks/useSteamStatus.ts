"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FullStatus, HistoryPoint } from "../types";
import { API_BASE, WS_URL } from "../api-config";

interface UseSteamStatusReturn {
  status: FullStatus | null;
  connected: boolean;
  error: string | null;
  history: Record<string, HistoryPoint[]>;
}

export function useSteamStatus(): UseSteamStatusReturn {
  const [status, setStatus] = useState<FullStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, HistoryPoint[]>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchHistory = useCallback(async () => {
    try {
      const metricsRes = await fetch(`${API_BASE}/api/v1/history`);
      const { metrics } = await metricsRes.json();

      const results: Record<string, HistoryPoint[]> = {};
      await Promise.all(
        (metrics as string[]).map(async (metric: string) => {
          const res = await fetch(`${API_BASE}/api/v1/history/${metric}`);
          const data = await res.json();
          results[metric] = data.points;
        })
      );
      setHistory(results);
    } catch {
      // History is non-critical, silently ignore
    }
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "status") {
          setStatus(msg.data);
        } else if (msg.type === "statusChange") {
          // On any status change, we'll get a full status update shortly
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Reconnect after 3s
      reconnectTimeout.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      setError("Connection lost. Reconnecting...");
      ws.close();
    };
  }, []);

  useEffect(() => {
    // Initial fetch as fallback
    fetch(`${API_BASE}/api/v1/status`)
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setError("Cannot reach Steam Monitor service"));

    fetchHistory();
    connectWs();

    // Refresh history every 60s
    const historyInterval = setInterval(fetchHistory, 60000);

    return () => {
      clearInterval(historyInterval);
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connectWs, fetchHistory]);

  return { status, connected, error, history };
}
