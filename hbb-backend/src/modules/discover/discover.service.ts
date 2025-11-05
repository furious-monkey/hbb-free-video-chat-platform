
import { IPublicUser, IUser, IProfile } from './discover.interface';
import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import * as profileRepository from './discover.repository';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { fetchProfileImage, fetchPromotionalVideos } from '../../utils/media.utils';
import { publicProfile } from '../../utils/profile.utils';
import { fetchInterests, fetchZodiacSign } from '../../utils/profileService.utils';


const prisma = new PrismaClient();

export const discoverInfluencers = async (
  userId: string
): Promise<{
  user: IPublicUser;
  liked: boolean;
} | null> => {
  // Fetch the likedProfiles of the user making the request
  const userProfile = await prisma.profile.findUnique({
    where: { userId },
    select: { likedProfiles: true },
  });

  const likedProfiles = userProfile?.likedProfiles ?? [];

  // Fetch a single random influencer excluding those already liked
  const influencer = await prisma.user.findFirst({
    where: {
      userRole: 'INFLUENCER',
      id: {
        notIn: likedProfiles, 
      },
    },
    include: {
      profile: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    skip: Math.floor(Math.random() * (await prisma.user.count({
      where: {
        userRole: 'INFLUENCER',
        id: {
          notIn: likedProfiles,
        },
      },
    }))),
    take: 1,
  });

  if (!influencer || !influencer.profile) return null;

  // Fetch profile image and promotional videos
  const profileImage = await fetchProfileImage(influencer?.profileImage || null);
  const promotionalVideos = await fetchPromotionalVideos(influencer?.promotionalVideo || []);

  // Fetch interests and zodiac sign details
  const interestsDetails = await fetchInterests(influencer?.profile?.interests || []);
  const zodiacSignDetails = await fetchZodiacSign(influencer?.profile?.zodiacSign || null);

  // Combine the media and other details into the influencer object
  const influencerWithDetails = {
    ...influencer,
    profileImageDetails: profileImage || undefined,
    promotionalVideoDetails: promotionalVideos,
    interestsDetails,
    zodiacSignDetails,
  };

  return {
    user: publicProfile(influencerWithDetails),
    liked: likedProfiles.includes(influencer.id),
  };
};


export const likeInfluencer = async (userId: string, influencerId: string): Promise<IProfile | null> => {
  const userProfile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!userProfile) {
    throw new Error('User profile not found');
  }

  // Check if the influencer is already in the likedProfiles
  if (userProfile.likedProfiles.includes(influencerId)) {
    return null; 
  }

  const updatedLikedProfiles = [...(userProfile.likedProfiles || []), influencerId];

  return prisma.profile.update({
    where: { userId },
    data: {
      likedProfiles: updatedLikedProfiles,
    },
  });
};