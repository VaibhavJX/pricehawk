import { useEffect, useRef, useCallback } from 'react';
import useStore from '../store/useStore';

const BASE_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const MAX_RETRIES = 8;
const BASE_DELAY = 1000;

/**
 * Custom hook that connects to the WebSocket server for a given userId.
 * Automatically reconnects with exponential backoff on disconnect.
 * Dispatches price updates and notifications to the Zustand store.
 */
const useWebSocket = (userId) => {
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const updateProductPrice = useStore((s) => s.updateProductPrice);
  const addNotification = useStore((s) => s.addNotification);
  const setPriceDrop = useStore((s) => s.setPriceDrop);

  const connect = useCallback(() => {
    if (!userId || !mountedRef.current) return;

    try {
      const ws = new WebSocket(`${BASE_WS_URL}/ws/${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Error:', err);
      };

      ws.onclose = (event) => {
        console.log(`[WS] Closed (code: ${event.code})`);
        if (!mountedRef.current) return;
        scheduleReconnect();
      };
    } catch (err) {
      console.warn('[WS] Connection failed:', err);
      scheduleReconnect();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = useCallback(
    (message) => {
      switch (message.type) {
        case 'price_update': {
          const { productId, currentPrice, previousPrice, priceChange, priceChangePercent, timestamp } =
            message.data;
          updateProductPrice(productId, {
            currentPrice,
            previousPrice,
            priceChange,
            priceChangePercent,
            timestamp,
          });

          // If price dropped, show banner
          if (priceChange < 0) {
            setPriceDrop({
              productId,
              productName: message.data.productName,
              currentPrice,
              previousPrice,
              priceChange,
              priceChangePercent,
            });

            addNotification({
              type: 'price_drop',
              title: 'Price Drop!',
              body: `${message.data.productName} dropped by ₹${Math.abs(priceChange).toFixed(0)}`,
              productId,
              timestamp: Date.now(),
            });
          }
          break;
        }

        case 'check_complete': {
          updateProductPrice(message.data.productId, message.data);
          break;
        }

        case 'notification': {
          addNotification({
            type: message.data.type || 'info',
            title: message.data.title,
            body: message.data.body,
            timestamp: Date.now(),
          });
          break;
        }

        default:
          break;
      }
    },
    [updateProductPrice, addNotification, setPriceDrop]
  );

  const scheduleReconnect = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES || !mountedRef.current) return;

    const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), 30000);
    retryCountRef.current += 1;

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);

    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    if (userId) connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [userId, connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendMessage };
};

export default useWebSocket;
