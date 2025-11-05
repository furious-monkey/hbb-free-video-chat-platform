// useInfluencerDetailsWebSocket.ts
import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { IPublicInfluencer } from '@/src/types/influencer';

export const useInfluencerDetailsWebSocket = (username: string) => {
  const { socket, isConnected } = useWebSocket();
  const [influencer, setInfluencer] = useState<IPublicInfluencer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencer = useCallback(() => {
    if (!socket || !isConnected || !username) return;

    setLoading(true);
    setError(null);

    socket.emit('get_influencer_by_username', { username }, (response) => {
      setLoading(false);
      
      if (response.success && response.data) {
        setInfluencer(response.data.influencer);
      } else {
        setError(response.error || 'Failed to fetch influencer');
      }
    });
  }, [socket, isConnected, username]);

  useEffect(() => {
    if (!socket || !influencer) return;

    const handleStatusChanged = (data: any) => {
      if (data.influencerId === influencer.id) {
        setInfluencer(prev => prev ? {
          ...prev,
          isOnline: data.status === 'online' || data.status === 'live',
          isLive: data.status === 'live',
        } : null);
      }
    };

    socket.on('INFLUENCER_STATUS_CHANGED', handleStatusChanged);

    return () => {
      socket.off('INFLUENCER_STATUS_CHANGED', handleStatusChanged);
    };
  }, [socket, influencer]);

  useEffect(() => {
    if (isConnected) {
      fetchInfluencer();
    }
  }, [isConnected, username, fetchInfluencer]);

  return {
    influencer,
    loading,
    error,
    isConnected,
    refetch: fetchInfluencer,
  };
};