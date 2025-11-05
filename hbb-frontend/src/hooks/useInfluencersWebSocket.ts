import { useEffect, useCallback, useRef, useState } from 'react';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { IPublicInfluencer } from '@/src/types/influencer';
import { v4 as uuidv4 } from 'uuid';

interface UseInfluencersWebSocketProps {
  categories?: string[];
  searchTerm?: string;
  limit?: number;
  onlineOnly?: boolean;
  autoSubscribe?: boolean;
}

export const useInfluencersWebSocket = ({
  categories = [],
  searchTerm = '',
  limit = 10,
  onlineOnly = true,
  autoSubscribe = true,
}: UseInfluencersWebSocketProps) => {
  const { socket, isConnected } = useWebSocket();
  const sessionRef = useRef<string>(uuidv4());
  const lastFetchParamsRef = useRef<string>('');
  const isFetchingRef = useRef(false);
  const hasInitialFetchRef = useRef(false);
  
  // State management
  const [influencers, setInfluencers] = useState<IPublicInfluencer[]>([]);
  const [paginationData, setPaginationData] = useState({
    nextCursor: null as string | null,
    hasNextPage: false,
  });
  const [statusBreakdown, setStatusBreakdown] = useState({
    live: 0,
    online: 0,
    offline: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for parameters to avoid stale closures in callbacks
  const categoriesRef = useRef(categories);
  const searchTermRef = useRef(searchTerm);
  const onlineOnlyRef = useRef(onlineOnly);

  useEffect(() => {
    categoriesRef.current = categories;
    searchTermRef.current = searchTerm;
    onlineOnlyRef.current = onlineOnly;
  }, [categories, searchTerm, onlineOnly]);

  // Create a stable params key - FIXED to handle empty search term properly
  const createParamsKey = useCallback(() => {
    // Include a placeholder for empty search to ensure it's detected as a change
    const searchKey = searchTerm === '' ? '__EMPTY__' : searchTerm;
    return `${categories.sort().join(',')}_${searchKey}_${onlineOnly}`;
  }, [categories, searchTerm, onlineOnly]);

  // Fetch influencers - FIXED to handle empty search term
  const fetchInfluencers = useCallback(
    (cursor?: string | null, append = false) => {
      if (!socket || !isConnected || isFetchingRef.current) {
        console.log('❌ Cannot fetch: socket not ready or already fetching', {
          hasSocket: !!socket,
          isConnected,
          isFetching: isFetchingRef.current
        });
        return;
      }

      console.log('🔍 Fetching influencers with params:', {
        cursor,
        categories: categoriesRef.current,
        searchTerm: searchTermRef.current,
        limit,
        onlineOnly: onlineOnlyRef.current,
        append
      });

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      // FIXED: Don't send searchTerm if it's empty
      const requestParams: any = {
        cursor: cursor || undefined,
        categories: categoriesRef.current.length > 0 ? categoriesRef.current : undefined,
        limit,
        onlineOnly: onlineOnlyRef.current,
        sessionId: sessionRef.current,
      };

      // Only include searchTerm if it's not empty
      if (searchTermRef.current && searchTermRef.current.trim() !== '') {
        requestParams.searchTerm = searchTermRef.current;
      }

      socket.emit('get_influencers', requestParams, (response) => {
        console.log('📦 Get influencers response:', response);
        
        isFetchingRef.current = false;
        setLoading(false);
        
        if (response && response.success && response.data) {
          console.log(`✅ Received ${response.data.influencers.length} influencers`);
          console.log('📊 Status breakdown:', response.data.statusBreakdown);
          
          if (append) {
            setInfluencers(prev => {
              // Create a map to ensure uniqueness by ID
              const existingMap = new Map(prev.map(item => [item.id, item]));
              
              // Add new influencers to the map
              response.data.influencers.forEach((item: IPublicInfluencer) => {
                existingMap.set(item.id, item);
              });
              
              // Convert back to array
              const combined = Array.from(existingMap.values());
              
              console.log(`📊 Combined influencers: ${combined.length} (was ${prev.length}, added ${response.data.influencers.length})`);
              
              return combined;
            });
            
            // Update status breakdown by adding new counts
            setStatusBreakdown(prev => ({
              live: prev.live + (response.data.statusBreakdown?.live || 0),
              online: prev.online + (response.data.statusBreakdown?.online || 0),
              offline: prev.offline + (response.data.statusBreakdown?.offline || 0),
              total: prev.total + (response.data.statusBreakdown?.total || 0),
            }));
          } else {
            // Replace all influencers
            setInfluencers(response.data.influencers);
            
            // Replace status breakdown
            setStatusBreakdown(response.data.statusBreakdown || {
              live: 0,
              online: 0,
              offline: 0,
              total: 0,
            });
          }
          
          setPaginationData({
            nextCursor: response.data.nextCursor,
            hasNextPage: response.data.hasNextPage,
          });
        } else {
          console.error('❌ Error fetching influencers:', response?.error);
          setError(response?.error || 'Failed to fetch influencers');
        }
      });
    },
    [socket, isConnected, limit]
  );

  // Load more
  const loadMore = useCallback(() => {
    if (paginationData.hasNextPage && paginationData.nextCursor && !isFetchingRef.current) {
      console.log('📄 Loading more influencers with cursor:', paginationData.nextCursor);
      fetchInfluencers(paginationData.nextCursor, true);
    }
  }, [paginationData, fetchInfluencers]);

  // Subscribe to updates - FIXED to handle empty search term
  const subscribeToUpdates = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log('📡 Subscribing to influencer updates');
    
    const subscribeParams: any = {
      categories: categoriesRef.current.length > 0 ? categoriesRef.current : undefined,
    };

    // Only include searchTerm if it's not empty
    if (searchTermRef.current && searchTermRef.current.trim() !== '') {
      subscribeParams.searchTerm = searchTermRef.current;
    }

    socket.emit('subscribe_to_influencer_updates', subscribeParams);
  }, [socket, isConnected]);

  // Unsubscribe from updates
  const unsubscribeFromUpdates = useCallback(() => {
    if (!socket || !isConnected) return;

    console.log('🔕 Unsubscribing from influencer updates');
    socket.emit('unsubscribe_from_influencer_updates');
  }, [socket, isConnected]);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    const handleInfluencersList = (data: any) => {
      console.log('📨 INFLUENCERS_LIST event:', data);
      
      if (data.sessionId !== sessionRef.current) return;
      
      setLoading(false);
      isFetchingRef.current = false;
      setInfluencers(data.influencers);
      setPaginationData({
        nextCursor: data.nextCursor,
        hasNextPage: data.hasNextPage,
      });
      setStatusBreakdown(data.statusBreakdown || {
        live: 0,
        online: 0,
        offline: 0,
        total: 0,
      });
    };

    const handleError = (data: any) => {
      console.log('❌ DISCOVERY_ERROR event:', data);
      
      if (data.sessionId && data.sessionId !== sessionRef.current) return;
      
      setLoading(false);
      isFetchingRef.current = false;
      setError(data.message);
    };

    const handleStatusChanged = (data: any) => {
      console.log('🔄 INFLUENCER_STATUS_CHANGED event:', data);
      
      setInfluencers(prev => 
        prev.map(inf => 
          inf.id === data.influencerId
            ? {
                ...inf,
                isOnline: data.status === 'online' || data.status === 'live',
                isLive: data.status === 'live',
              }
            : inf
        )
      );
      
      // Update status breakdown
      setStatusBreakdown(prev => {
        const newBreakdown = { ...prev };
        
        // Decrease previous status count
        if (data.previousStatus === 'live') newBreakdown.live = Math.max(0, newBreakdown.live - 1);
        else if (data.previousStatus === 'online') newBreakdown.online = Math.max(0, newBreakdown.online - 1);
        else newBreakdown.offline = Math.max(0, newBreakdown.offline - 1);
        
        // Increase new status count
        if (data.status === 'live') newBreakdown.live++;
        else if (data.status === 'online') newBreakdown.online++;
        else newBreakdown.offline++;
        
        return newBreakdown;
      });
    };

    const handleInfluencerWentLive = (data: any) => {
      console.log('🎬 INFLUENCER_WENT_LIVE event:', data);
      
      setInfluencers(prev => 
        prev.map(inf => 
          inf.id === data.influencerId
            ? { 
                ...inf, 
                isLive: true, 
                isOnline: true,
                streamInfo: {
                  id: data.streamId,
                  status: 'LIVE',
                  allowBids: data.allowBids,
                  startTime: new Date(),
                  earnings: 0,
                  hasExplorer: false
                }
              }
            : inf
        )
      );
    };

    const handleInfluencerEndedStream = (data: any) => {
      console.log('🛑 INFLUENCER_ENDED_STREAM event:', data);
      
      setInfluencers(prev => 
        prev.map(inf => 
          inf.id === data.influencerId
            ? { 
                ...inf, 
                isLive: false,
                streamInfo: null 
              }
            : inf
        )
      );
    };

    const handleStreamCreated = (data: any) => {
      console.log('🎥 STREAM_CREATED event:', data);
      
      // When a new stream is created, we might need to add the influencer if they're not in the list
      // or update their status if they are
      if (data.success && data.session) {
        const { influencer, id: streamId, allowBids, startTime } = data.session;
        
        setInfluencers(prev => {
          const existingIndex = prev.findIndex(inf => inf.id === influencer.id);
          
          if (existingIndex >= 0) {
            // Update existing influencer
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              isLive: true,
              isOnline: true,
              streamInfo: {
                id: streamId,
                status: 'LIVE',
                allowBids,
                startTime: startTime ? new Date(startTime) : new Date(),
                earnings: 0,
                hasExplorer: false
              }
            };
            return updated;
          } else if (onlineOnlyRef.current) {
            // For now, just trigger a refetch when a new stream is created
            // This ensures we get the complete influencer data from the server
            console.log('➕ New influencer went live, triggering refetch');
            
            // We can't add a partial influencer object because it's missing required fields
            // Instead, we should refetch the influencers list
            setTimeout(() => {
              fetchInfluencers();
            }, 1000); // Small delay to ensure the server has updated
          }
          
          return prev;
        });
        
        // Update status breakdown
        setStatusBreakdown(prev => ({
          ...prev,
          live: prev.live + 1,
          online: Math.max(0, prev.online - 1), // Assuming they were online before going live
        }));
      }
    };

    socket.on('INFLUENCERS_LIST', handleInfluencersList);
    socket.on('DISCOVERY_ERROR', handleError);
    socket.on('INFLUENCER_STATUS_CHANGED', handleStatusChanged);
    socket.on('INFLUENCER_WENT_LIVE', handleInfluencerWentLive);
    socket.on('INFLUENCER_ENDED_STREAM', handleInfluencerEndedStream);
    socket.on('STREAM_CREATED', handleStreamCreated);

    return () => {
      socket.off('INFLUENCERS_LIST', handleInfluencersList);
      socket.off('DISCOVERY_ERROR', handleError);
      socket.off('INFLUENCER_STATUS_CHANGED', handleStatusChanged);
      socket.off('INFLUENCER_WENT_LIVE', handleInfluencerWentLive);
      socket.off('INFLUENCER_ENDED_STREAM', handleInfluencerEndedStream);
      socket.off('STREAM_CREATED', handleStreamCreated);
    };
  }, [socket, onlineOnly]);

  // Initial fetch and subscribe when connected
  useEffect(() => {
    if (isConnected && !hasInitialFetchRef.current) {
      console.log('🚀 Initial fetch - WebSocket connected');
      hasInitialFetchRef.current = true;
      if (autoSubscribe) subscribeToUpdates();
      fetchInfluencers();
    }
  }, [isConnected, fetchInfluencers, autoSubscribe, subscribeToUpdates]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (autoSubscribe) unsubscribeFromUpdates();
    };
  }, [autoSubscribe, unsubscribeFromUpdates]);

  // Fetch when params change (debounced) - FIXED to properly detect empty search
  useEffect(() => {
    if (!isConnected || !hasInitialFetchRef.current) return;

    const currentParamsKey = createParamsKey();
    
    // Check if params actually changed
    if (currentParamsKey === lastFetchParamsRef.current) {
      console.log('⏸️ Params unchanged, skipping fetch');
      return;
    }

    console.log('🔄 Params changed, scheduling debounced refetch', {
      old: lastFetchParamsRef.current,
      new: currentParamsKey,
      searchTerm: searchTerm
    });
    
    // Update the last params
    lastFetchParamsRef.current = currentParamsKey;

    // Debounce the reset, subscribe update, and fetch
    const timeoutId = setTimeout(() => {
      console.log('🚀 Executing debounced refetch');
      setInfluencers([]);
      setPaginationData({ nextCursor: null, hasNextPage: false });
      sessionRef.current = uuidv4();
      
      if (autoSubscribe) {
        unsubscribeFromUpdates();
        subscribeToUpdates();
      }
      
      fetchInfluencers();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isConnected, createParamsKey, fetchInfluencers, autoSubscribe, subscribeToUpdates, unsubscribeFromUpdates]);

  // Debug log current state
  useEffect(() => {
    console.log('📊 Current influencers state:', {
      count: influencers.length,
      live: influencers.filter(i => i.isLive).length,
      online: influencers.filter(i => i.isOnline).length,
      searchTerm: searchTerm,
      categories: categories,
      influencers: influencers.map(i => ({
        id: i.id,
        username: i.profile?.username,
        isLive: i.isLive,
        isOnline: i.isOnline,
        streamInfo: i.streamInfo
      }))
    });
  }, [influencers, searchTerm, categories]);

  return {
    influencers,
    paginationData,
    statusBreakdown,
    loading,
    error,
    isConnected,
    fetchInfluencers,
    loadMore,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  };
};