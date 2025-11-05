import { Service } from 'typedi';
import { PrismaClient, StreamStatus } from '@prisma/client';
import { ICallHistory, ICallHistoryService } from './callHistory.interface';
import { fetchProfileImage } from '../../utils/media.utils';

interface PrismaCallHistory {
id: string;
streamSessionId: string;
influencerId: string;
explorerId: string | null;
startTime: Date;
endTime: Date | null;
duration: number | null;
earnings: number | null;
createdAt: Date;
updatedAt: Date;
streamSession: {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  status: StreamStatus;
  gifts?: Array<{
    id: string;
    amount: number;
    createdAt: Date;
    giftType: {
      name: string;
      imageUrl: string;
      price: number;
    };
  }>;
};
influencer: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  profile: {
    username: string | null;
    location?: string | null;
  } | null;
};
explorer: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  profile: {
    username: string | null;
    location?: string | null;
  } | null;
} | null;
}

@Service()
export class CallHistoryService implements ICallHistoryService {
private prisma: PrismaClient;

constructor() {
  this.prisma = new PrismaClient();
}

private async transformCallHistory(history: PrismaCallHistory): Promise<ICallHistory> {
  // Fetch profile images for both influencer and explorer
  const [influencerImageData, explorerImageData] = await Promise.all([
    fetchProfileImage(history.influencer.profileImage),
    history.explorer ? fetchProfileImage(history.explorer.profileImage) : Promise.resolve(null)
  ]);

  return {
    id: history.id,
    streamSessionId: history.streamSessionId,
    influencerId: history.influencerId,
    explorerId: history.explorerId ?? undefined,
    startTime: history.startTime,
    endTime: history.endTime ?? undefined,
    duration: history.duration ?? undefined,
    earnings: history.earnings ?? undefined,
    createdAt: history.createdAt,
    updatedAt: history.updatedAt,
    // Include the complete influencer data with resolved image URL
    influencer: {
      id: history.influencer.id,
      firstName: history.influencer.firstName,
      lastName: history.influencer.lastName,
      profileImage: influencerImageData?.url || influencerImageData?.Location || null,
      profile: history.influencer.profile ? {
        username: history.influencer.profile.username,
        location: history.influencer.profile.location
      } : null
    },
    // Include the complete explorer data (if exists) with resolved image URL
    explorer: history.explorer ? {
      id: history.explorer.id,
      firstName: history.explorer.firstName,
      lastName: history.explorer.lastName,
      profileImage: explorerImageData?.url || explorerImageData?.Location || null,
      profile: history.explorer.profile ? {
        username: history.explorer.profile.username,
        location: history.explorer.profile.location
      } : null
    } : undefined,
    // Include stream session details
    streamSession: {
      id: history.streamSession.id,
      status: history.streamSession.status,
      startTime: history.streamSession.startTime,
      endTime: history.streamSession.endTime
    },
    // Include gifts if they exist
    gifts: history.streamSession.gifts || []
  };
}

async getCallHistoryByUserId(userId: string): Promise<ICallHistory[]> {
  try {
    const histories = await this.prisma.callHistory.findMany({
      where: {
        OR: [
          { influencerId: userId },
          { explorerId: userId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        influencer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            profile: {
              select: {
                username: true,
                location: true
              }
            }
          }
        },
        explorer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            profile: {
              select: {
                username: true,
                location: true
              }
            }
          }
        },
        streamSession: {
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            gifts: {
              select: {
                id: true,
                amount: true,
                createdAt: true,
                giftType: {
                  select: {
                    name: true,
                    imageUrl: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform all histories with resolved image URLs
    const transformedHistories = await Promise.all(
      histories.map(history => this.transformCallHistory(history))
    );

    return transformedHistories;
  } catch (error) {
    console.error('Error fetching call history:', error);
    throw error;
  }
}

async createCallHistory(data: {
  streamSessionId: string;
  influencerId: string;
  explorerId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  earnings?: number;
}): Promise<ICallHistory> {
  try {
    const created = await this.prisma.callHistory.create({
      data: {
        streamSessionId: data.streamSessionId,
        influencerId: data.influencerId,
        explorerId: data.explorerId,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        earnings: data.earnings
      },
      include: {
        influencer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            profile: {
              select: {
                username: true,
                location: true
              }
            }
          }
        },
        explorer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            profile: {
              select: {
                username: true,
                location: true
              }
            }
          }
        },
        streamSession: {
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            gifts: {
              select: {
                id: true,
                amount: true,
                createdAt: true,
                giftType: {
                  select: {
                    name: true,
                    imageUrl: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return await this.transformCallHistory(created as PrismaCallHistory);
  } catch (error) {
    console.error('Error creating call history:', error);
    throw error;
  }
}
}