// modules/influencer/influencer.service.ts - Fixed to properly prioritize live streamers
import { PrismaClient } from '@prisma/client';
import { PaginatedInfluencersDto } from './influencer.dto';
import { fetchProfileImage, fetchPromotionalVideos } from '../../utils/media.utils';
import { fetchInterests, fetchZodiacSign } from '../../utils/profileService.utils';
import { IEPublicInfluencer } from '../discover/discover.interface';
import { getRedisClient } from '../../config/redis';

const prisma = new PrismaClient();

export async function getPaginatedInfluencers(
  payload: PaginatedInfluencersDto,
): Promise<{ influencers: IEPublicInfluencer[]; nextCursor: string | null; hasNextPage: boolean }> {
  const { cursor, search_term, limit } = payload;
  const take = limit && !isNaN(Number(limit)) ? parseInt(String(limit)) : 10;

  let parsedCategories: string[] = [];
  if (typeof payload.categories === 'string') {
    parsedCategories = payload.categories.split(',').filter(Boolean);
  } else if (Array.isArray(payload.categories)) {
    parsedCategories = payload.categories;
  }

  // Get online user IDs from Redis
  const onlineKeys = await getRedisClient().keys('user:online:*');
  const onlineUserIds: Set<string> = new Set<string>(
    onlineKeys.map((key: string): string => key.replace('user:online:', ''))
  );

  // Get live streaming user IDs from database
  const liveStreams = await prisma.streamSession.findMany({
    where: { status: 'LIVE' },
    select: { influencerId: true },
  });
  const liveUserIds: Set<string> = new Set<string>(liveStreams.map(stream => stream.influencerId));

  // Build base filters
  const baseWhere: any = {
    userRole: 'INFLUENCER',
    profile: { isNot: null },
  };

  const profileFilters: any = {};
  
  // Categories filter - this IS still here!
  if (parsedCategories.length > 0) {
    profileFilters.category = { hasSome: parsedCategories };
    console.log('🔍 Filtering by categories:', parsedCategories);
  }
  
  // Search filter
  if (search_term?.trim()) {
    profileFilters.username = {
      contains: search_term,
      mode: 'insensitive',
    };
    console.log('🔍 Filtering by search term:', search_term);
  }
  
  if (Object.keys(profileFilters).length > 0) {
    baseWhere.profile.is = profileFilters;
    console.log('🔍 Applied profile filters:', profileFilters);
  }

  // Fetch influencers in priority order: live → online → offline
  let allInfluencers: any[] = [];
  let totalFetched = 0;
  
  // For cursor handling, we need to track which priority group we're in
  let currentPriorityOffset = 0;
  if (cursor) {
    // Parse cursor to understand where we left off
    // Format: "priority_offset_lastId" (e.g., "1_10_uuid" means priority 1, offset 10, last ID)
    const [priority, offset, lastId] = cursor.split('_');
    currentPriorityOffset = parseInt(offset) || 0;
  }

  // Priority 1: Live streamers
  if (liveUserIds.size > 0) {
    const liveWhere = {
      ...baseWhere,
      id: { in: Array.from(liveUserIds) },
    };

    const liveInfluencers = await prisma.user.findMany({
      where: liveWhere,
      include: { profile: true },
      orderBy: { createdAt: 'desc' }, // Most recent streams first
      skip: cursor && cursor.startsWith('1_') ? currentPriorityOffset : 0,
      take: take + 1, // +1 to check for more
    });

    allInfluencers.push(...liveInfluencers.map(inf => ({ ...inf, _priority: 1 })));
    totalFetched += liveInfluencers.length;

    // If we got enough from live streamers, return early
    if (liveInfluencers.length >= take) {
      const hasNextPage = liveInfluencers.length > take;
      const influencersToReturn = hasNextPage ? liveInfluencers.slice(0, take) : liveInfluencers;
      
      const formattedInfluencers = await formatInfluencers(influencersToReturn, onlineUserIds, liveUserIds);
      
      return {
        influencers: formattedInfluencers,
        nextCursor: hasNextPage ? `1_${currentPriorityOffset + take}_${influencersToReturn[influencersToReturn.length - 1].id}` : null,
        hasNextPage,
      };
    }
  }

  // Priority 2: Online (but not live) streamers
  const onlineNotLive = Array.from(onlineUserIds).filter(id => !liveUserIds.has(id));
  if (onlineNotLive.length > 0 && totalFetched < take) {
    const onlineWhere = {
      ...baseWhere,
      id: { in: onlineNotLive },
    };

    const skipOnline = cursor && cursor.startsWith('2_') ? currentPriorityOffset : 0;
    const takeOnline = take - totalFetched + 1;

    const onlineInfluencers = await prisma.user.findMany({
      where: onlineWhere,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      skip: skipOnline,
      take: takeOnline,
    });

    allInfluencers.push(...onlineInfluencers.map(inf => ({ ...inf, _priority: 2 })));
    totalFetched += onlineInfluencers.length;

    // If we got enough from live + online, return
    if (totalFetched >= take) {
      const hasNextPage = totalFetched > take;
      const influencersToReturn = hasNextPage ? allInfluencers.slice(0, take) : allInfluencers;
      
      const formattedInfluencers = await formatInfluencers(influencersToReturn, onlineUserIds, liveUserIds);
      
      // Calculate next cursor
      let nextCursor = null;
      if (hasNextPage) {
        const onlineItemsReturned = influencersToReturn.filter(inf => inf._priority === 2).length;
        const totalOnlineOffset = skipOnline + onlineItemsReturned;
        nextCursor = `2_${totalOnlineOffset}_${influencersToReturn[influencersToReturn.length - 1].id}`;
      }
      
      return {
        influencers: formattedInfluencers,
        nextCursor,
        hasNextPage,
      };
    }
  }

  // Priority 3: Offline users
  if (totalFetched < take) {
    const allOnlineIds = Array.from(onlineUserIds);
    const offlineWhere = {
      ...baseWhere,
      id: { notIn: allOnlineIds },
    };

    const skipOffline = cursor && cursor.startsWith('3_') ? currentPriorityOffset : 0;
    const takeOffline = take - totalFetched + 1;

    const offlineInfluencers = await prisma.user.findMany({
      where: offlineWhere,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      skip: skipOffline,
      take: takeOffline,
    });

    allInfluencers.push(...offlineInfluencers.map(inf => ({ ...inf, _priority: 3 })));
    totalFetched += offlineInfluencers.length;
  }

  // Format final results
  const hasNextPage = totalFetched > take;
  const influencersToReturn = hasNextPage ? allInfluencers.slice(0, take) : allInfluencers;
  
  const formattedInfluencers = await formatInfluencers(influencersToReturn, onlineUserIds, liveUserIds);

  // Calculate next cursor for offline users
  let nextCursor = null;
  if (hasNextPage && influencersToReturn[influencersToReturn.length - 1]._priority === 3) {
    const skipOffline = cursor && cursor.startsWith('3_') ? currentPriorityOffset : 0;
    const offlineItemsReturned = influencersToReturn.filter(inf => inf._priority === 3).length;
    const totalOfflineOffset = skipOffline + offlineItemsReturned;
    nextCursor = `3_${totalOfflineOffset}_${influencersToReturn[influencersToReturn.length - 1].id}`;
  }

  return {
    influencers: formattedInfluencers,
    nextCursor,
    hasNextPage,
  };
}

// Helper function to format influencers
async function formatInfluencers(
  influencers: any[], 
  onlineUserIds: Set<string>, 
  liveUserIds: Set<string>
): Promise<IEPublicInfluencer[]> {
  return Promise.all(
    influencers.map(async (influencer: any) => {
      const profileImage = await fetchProfileImage(influencer?.profileImage || null);
      const promotionalVideos = await fetchPromotionalVideos(influencer?.promotionalVideo || []);
      const interestsDetails = await fetchInterests(influencer.profile?.interests || []);
      const zodiacSignDetails = await fetchZodiacSign(influencer.profile?.zodiacSign || null);
      
      const isOnline = onlineUserIds.has(influencer.id);
      const isLive = liveUserIds.has(influencer.id);

      return {
        id: influencer.id,
        gender: influencer.gender,
        promotionalVideo: influencer.promotionalVideo || [],
        profileImageDetails: profileImage || undefined,
        promotionalVideoDetails: promotionalVideos,
        interestsDetails,
        isOnline,
        isLive,
        profile: influencer.profile,
        zodiacSignDetails: zodiacSignDetails || undefined,
      } as IEPublicInfluencer;
    })
  );
}

// Simpler version with offset-based pagination (recommended)
export async function getPaginatedInfluencersSimple(
  payload: PaginatedInfluencersDto,
): Promise<{ influencers: IEPublicInfluencer[]; nextCursor: string | null; hasNextPage: boolean }> {
  const { search_term, limit } = payload;
  const take = limit && !isNaN(Number(limit)) ? parseInt(String(limit)) : 10;
  const page = payload.cursor ? parseInt(payload.cursor) : 1;
  const skip = (page - 1) * take;

  let parsedCategories: string[] = [];
  if (typeof payload.categories === 'string') {
    parsedCategories = payload.categories.split(',').filter(Boolean);
  } else if (Array.isArray(payload.categories)) {
    parsedCategories = payload.categories;
  }

  // Get online and live user sets
  const onlineKeys = await getRedisClient().keys('user:online:*');
  const onlineUserIds: Set<string> = new Set(onlineKeys.map((key: string) => key.replace('user:online:', '')));

  const liveStreams = await prisma.streamSession.findMany({
    where: { status: 'LIVE' },
    select: { influencerId: true },
  });
  const liveUserIds = new Set(liveStreams.map(stream => stream.influencerId));

  // Build base filters
  const baseWhere: any = {
    userRole: 'INFLUENCER',
    profile: { isNot: null },
  };

  const profileFilters: any = {};
  
  // Categories filter - ensuring it works with the simple version too
  if (parsedCategories.length > 0) {
    profileFilters.category = { hasSome: parsedCategories };
    console.log('🔍 Simple version - Filtering by categories:', parsedCategories);
  }
  
  // Search filter  
  if (search_term?.trim()) {
    profileFilters.username = {
      contains: search_term,
      mode: 'insensitive',
    };
    console.log('🔍 Simple version - Filtering by search term:', search_term);
  }
  
  if (Object.keys(profileFilters).length > 0) {
    baseWhere.profile.is = profileFilters;
    console.log('🔍 Simple version - Applied profile filters:', profileFilters);
  }

  // Get all influencers (we'll sort by priority)
  const allInfluencers = await prisma.user.findMany({
    where: baseWhere,
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });

  // Sort by priority: live → online → offline
  const sortedInfluencers = allInfluencers.sort((a, b) => {
    const aIsLive = liveUserIds.has(a.id);
    const bIsLive = liveUserIds.has(b.id);
    const aIsOnline = onlineUserIds.has(a.id);
    const bIsOnline = onlineUserIds.has(b.id);

    // Priority calculation
    const aPriority = aIsLive ? 1 : aIsOnline ? 2 : 3;
    const bPriority = bIsLive ? 1 : bIsOnline ? 2 : 3;

    if (aPriority !== bPriority) {
      return aPriority - bPriority; // Lower number = higher priority
    }

    // Within same priority, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Apply pagination
  const paginatedInfluencers = sortedInfluencers.slice(skip, skip + take);
  const hasNextPage = sortedInfluencers.length > skip + take;

  // Format results
  const formattedInfluencers = await formatInfluencers(paginatedInfluencers, onlineUserIds, liveUserIds);

  return {
    influencers: formattedInfluencers,
    nextCursor: hasNextPage ? (page + 1).toString() : null,
    hasNextPage,
  };
}

// Fetch influencer by username
export async function getInfluencerByUsername(
  username: string,
): Promise<IEPublicInfluencer | null> {
  const influencer = await prisma.user.findFirst({
    where: {
      profile: {
        username,
      },
      userRole: 'INFLUENCER',
    },
    include: {
      profile: true,
      streams: {
        where: { status: 'LIVE' },
        select: {
          id: true,
          status: true,
          allowBids: true,
          startTime: true,
          earnings: true,
          currentExplorerId: true
        },
      },
    },
  });

  if (!influencer) return null;

  // Check if user is online and live
  const isOnline = await getRedisClient().exists(`user:online:${influencer.id}`);
  const isLive = influencer.streams && influencer.streams.length > 0;

  const profileImage = await fetchProfileImage(influencer?.profileImage || null);
  const promotionalVideos = await fetchPromotionalVideos(influencer?.promotionalVideo || []);
  const interestsDetails = await fetchInterests(influencer?.profile?.interests || []);
  const zodiacSignDetails = await fetchZodiacSign(influencer?.profile?.zodiacSign || null);

  // Get stream info if live
  const streamInfo = isLive ? {
    id: influencer.streams[0].id,
    status: influencer.streams[0].status,
    allowBids: influencer.streams[0].allowBids,
    startTime: influencer.streams[0].startTime,
    earnings: influencer.streams[0].earnings,
    hasExplorer: !!influencer.streams[0].currentExplorerId
  } : null;

  return {
    id: influencer.id,
    gender: influencer.gender,
    promotionalVideo: influencer.promotionalVideo || [],
    profileImageDetails: profileImage || undefined,
    promotionalVideoDetails: promotionalVideos,
    interestsDetails,
    isOnline: !!isOnline,
    isLive,
    streamInfo,
    profile: {
      id: influencer.profile!.id,
      userId: influencer.profile!.userId,
      username: influencer.profile!.username,
      bio: influencer.profile!.bio,
      location: influencer.profile!.location,
      interests: influencer.profile!.interests,
      category: influencer.profile!.category,
      zodiacSign: influencer.profile!.zodiacSign,
      callRate: influencer.profile!.callRate,
      likedProfiles: influencer.profile!.likedProfiles,
      subscriptionPlan: influencer.profile!.subscriptionPlan,
      subscriptionStatus: influencer.profile!.subscriptionStatus,
      likes: influencer.profile!.likes,
      viewCount: influencer.profile!.viewCount,
      allowLike: influencer.profile!.allowLike
    },
    zodiacSignDetails: zodiacSignDetails || undefined,
  };
}

// Check if a username exists
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const influencer = await prisma.user.findFirst({
    where: {
      profile: {
        username,
      },
      userRole: 'INFLUENCER',
    },
  });

  return !influencer;
}