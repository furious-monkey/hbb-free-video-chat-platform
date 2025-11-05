// frontend/src/lib/providers/ClientWebSocketProvider.tsx
"use client";

import { WebSocketProvider } from '@/src/context/WebSocketContext';
import { useEffect, useState } from 'react';

export const ClientWebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return children;
  }

  return <WebSocketProvider>{children}</WebSocketProvider>;
};