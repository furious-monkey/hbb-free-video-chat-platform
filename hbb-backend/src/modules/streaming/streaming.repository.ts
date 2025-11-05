// modules/streaming/streaming.repository.ts - Streaming repository for handling stream creation, joining, bidding, and ending
import {
  PrismaClient,
  Prisma,
  StreamSession,
  User,
  Bid,
  Gift,
  GiftType,
} from '@prisma/client';
import {
  CreateStreamSessionDTO,
  JoinStreamDTO,
  PlaceBidDTO,
  SendGiftDTO,
  StreamSessionResponseDTO,
} from './streaming.dto';
import {
  fetchProfileImage,
  fetchPromotionalVideos,
} from '../../utils/media.utils';
import {
  fetchInterests,
  fetchZodiacSign,
} from '../../utils/profileService.utils';

// Define the actual return types from Prisma queries
export type StreamSessionWithIncludes = Prisma.StreamSessionGetPayload<{
  include: {
    influencer: {
      include: {
        profile: true;
      };
    };
    currentExplorer: {
      include: {
        profile: true;
      };
    };
    bids: {
      include: {
        explorer: {
          include: {
            profile: true;
          };
        };
      };
    };
    gifts: {
      include: {
        sender: {
          include: {
            profile: true;
          };
        };
        receiver: {
          include: {
            profile: true;
          };
        };
        giftType: true;
      };
    };
  };
}>;

type BidWithIncludes = Prisma.BidGetPayload<{
  include: {
    explorer: {
      include: {
        profile: true;
      };
    };
    streamSession: {
      include: {
        influencer: {
          include: {
            profile: true;
          };
        };
      };
    };
  };
}>;

type GiftWithIncludes = Prisma.GiftGetPayload<{
  include: {
    giftType: true;
    sender: {
      include: {
        profile: true;
      };
    };
    receiver: {
      include: {
        profile: true;
      };
    };
    streamSession: true;
  };
}>;

type UserWithProfile = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;

export class StreamingRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run operations in a database transaction for consistency
   */
  async runInTransaction<T>(
    callback: (transactionManager: PrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback(tx as PrismaClient);
    }, {
      timeout: 10000, // 10 second timeout
    });
  }

  /**
   * Create a new stream session.
   */
  async createStreamSession(
    data: CreateStreamSessionDTO,
  ): Promise<StreamSessionWithIncludes> {
    return this.prisma.streamSession.create({
      data: {
        influencerId: data.influencerId,
        allowBids: data.allowBids,
        status: 'LIVE',
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
    });
  }

  /**
   * Get a stream session by ID with all relations.
   */
  async getStreamSession(
    id: string,
  ): Promise<StreamSessionWithIncludes | null> {
    return this.prisma.streamSession.findUnique({
      where: { id },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
    });
  }

  /**
   * Get active stream for influencer
   */
  async getActiveStreamForInfluencer(
    influencerId: string,
  ): Promise<StreamSession | null> {
    return this.prisma.streamSession.findFirst({
      where: {
        influencerId,
        status: 'LIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update stream session with optional transaction manager
   */
  async updateStreamSession(
    id: string,
    data: any,
    transactionManager?: PrismaClient,
  ): Promise<StreamSessionWithIncludes> {
    const prisma = transactionManager || this.prisma;

    // If we're in a transaction, use a simpler update to avoid timeout
    if (transactionManager) {
      await prisma.streamSession.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      
      // Return the full session data after transaction
      const session = await this.getStreamSession(id);
      if (!session) {
        throw new Error('Stream session not found after update');
      }
      return session;
    }

    return prisma.streamSession.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
    });
  }

  /**
   * Join stream session - update with explorer
   */

  async joinStreamSession(data: JoinStreamDTO): Promise<any> {
    // Or use the full Prisma type
    return this.prisma.streamSession.update({
      where: { id: data.sessionId },
      data: {
        currentExplorerId: data.explorerId,
        status: 'LIVE',
        // REMOVED: startTime: new Date(), - This was resetting the stream start time
        updatedAt: new Date(),
      },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
    });
  }

  /**
   * Place a bid on a stream session.
   */
  async placeBid(data: PlaceBidDTO): Promise<BidWithIncludes> {
    return this.prisma.bid.create({
      data: {
        streamSessionId: data.sessionId,
        explorerId: data.explorerId,
        amount: data.amount,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        explorer: {
          include: {
            profile: true,
          },
        },
        streamSession: {
          include: {
            influencer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Send a gift during a stream session.
   */
  async sendGift(data: SendGiftDTO): Promise<GiftWithIncludes> {
    return this.prisma.gift.create({
      data: {
        streamSessionId: data.sessionId,
        senderId: data.explorerId,
        receiverId: data.influencerId,
        giftTypeId: data.giftTypeId,
        amount: data.amount,
        message: data.message,
        createdAt: new Date(),
      },
      include: {
        giftType: true,
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
        streamSession: true,
      },
    });
  }

  /**
   * Get stream bids with optional transaction manager
   */
  async getStreamBids(
    sessionId: string,
    transactionManager?: PrismaClient,
  ): Promise<BidWithIncludes[]> {
    const prisma = transactionManager || this.prisma;

    return prisma.bid.findMany({
      where: {
        streamSessionId: sessionId,
      },
      include: {
        explorer: {
          include: {
            profile: true,
          },
        },
        streamSession: {
          include: {
            influencer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }

  /**
   * Get stream gifts
   */
  async getStreamGifts(sessionId: string): Promise<GiftWithIncludes[]> {
    return this.prisma.gift.findMany({
      where: {
        streamSessionId: sessionId,
      },
      include: {
        giftType: true,
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
        streamSession: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get single bid by ID
   */
  async getBid(id: string): Promise<BidWithIncludes | null> {
    return this.prisma.bid.findUnique({
      where: { id },
      include: {
        explorer: {
          include: {
            profile: true,
          },
        },
        streamSession: {
          include: {
            influencer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update bid status with optional transaction manager
   */
  async updateBidStatus(
    id: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
    transactionManager?: PrismaClient,
  ): Promise<BidWithIncludes> {
    const prisma = transactionManager || this.prisma;

    return prisma.bid.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        explorer: {
          include: {
            profile: true,
          },
        },
        streamSession: {
          include: {
            influencer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get gift types
   */
  async getGiftTypes(): Promise<GiftType[]> {
    return this.prisma.giftType.findMany({
      where: { isActive: true },
      orderBy: {
        price: 'asc',
      },
    });
  }

  /**
   * Get single gift type by ID
   */
  async getGiftType(id: string): Promise<GiftType | null> {
    return this.prisma.giftType.findUnique({
      where: { id },
    });
  }

  /**
   * Get user details
   */
  async getUser(id: string): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Get all live streams with detailed information
   */
  async getLiveStreams(): Promise<StreamSessionWithIncludes[]> {
    return this.prisma.streamSession.findMany({
      where: {
        status: 'LIVE',
      },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get expired sessions (for cleanup)
   */
  async getExpiredSessions(): Promise<StreamSession[]> {
    const expiredThreshold = new Date();
    expiredThreshold.setHours(expiredThreshold.getHours() - 24); // Sessions older than 24 hours

    return this.prisma.streamSession.findMany({
      where: {
        status: 'LIVE',
        startTime: {
          lt: expiredThreshold,
        },
      },
    });
  }

  /**
   * Update user profile with new data (including callRate)
   */
  async updateUserProfile(
    userId: string,
    data: { callRate?: string; [key: string]: any },
  ): Promise<any> {
    console.log(
      `📝 [StreamingRepository] Updating profile for user ${userId} with data:`,
      data,
    );

    return this.prisma.profile.update({
      where: {
        userId: userId,
      },
      data: data,
    });
  }

  /**
   * Get user profile by userId
   */
  async getUserProfile(userId: string): Promise<any> {
    return this.prisma.profile.findUnique({
      where: {
        userId: userId,
      },
    });
  }

  /**
   * Get user with profile (useful for getting current callRate)
   */
  async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true,
      },
    });
  }
  /**
   * Get influencers with filters
   */
  async getInfluencers(params: {
    cursor?: string;
    categories?: string[];
    searchTerm?: string;
    limit?: number;
    onlineOnly?: boolean;
  }): Promise<UserWithProfile[]> {
    const where: Prisma.UserWhereInput = {
      userRole: 'INFLUENCER',
      isDeleted: false,
      isBanned: false,
    };

    // Add online filter if specified
    if (params.onlineOnly) {
      where.isOnline = true;
    }

    // Add search filter
    if (params.searchTerm) {
      where.OR = [
        {
          firstName: {
            contains: params.searchTerm,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: params.searchTerm,
            mode: 'insensitive',
          },
        },
        {
          profile: {
            username: {
              contains: params.searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          profile: {
            bio: {
              contains: params.searchTerm,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Add category filter
    if (params.categories && params.categories.length > 0) {
      where.profile = Object.assign({}, where.profile, {
        category: {
          hasSome: params.categories,
        },
      });
    }

    // Add cursor-based pagination
    if (params.cursor) {
      where.id = {
        gt: params.cursor,
      };
    }

    return this.prisma.user.findMany({
      where,
      include: {
        profile: true,
      },
      take: params.limit || 10,
      orderBy: {
        id: 'asc',
      },
    });
  }

  /**
   * Get influencer by username
   */
  async getInfluencerByUsername(
    username: string,
  ): Promise<UserWithProfile | null> {
    return this.prisma.user.findFirst({
      where: {
        userRole: 'INFLUENCER',
        isDeleted: false,
        isBanned: false,
        profile: {
          username: username,
        },
      },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Create or update user profile (upsert) - useful if profile doesn't exist yet
   */
  async upsertUserProfile(
    userId: string,
    data: { callRate?: string; [key: string]: any },
  ): Promise<any> {
    console.log(
      `🔄 [StreamingRepository] Upserting profile for user ${userId} with data:`,
      data,
    );

    return this.prisma.profile.upsert({
      where: {
        userId: userId,
      },
      update: data,
      create: {
        userId: userId,
        ...data,
      },
    });
  }

  /**
   * Get pending bids for a session
   */
  async getPendingBidsForSession(
    sessionId: string,
    transactionManager?: PrismaClient,
  ): Promise<BidWithIncludes[]> {
    const prisma = transactionManager || this.prisma;

    return prisma.bid.findMany({
      where: {
        streamSessionId: sessionId,
        status: 'PENDING',
      },
      include: {
        explorer: {
          include: {
            profile: true,
          },
        },
        streamSession: {
          include: {
            influencer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(sessionId: string): Promise<{
    totalBids: number;
    totalGifts: number;
    totalEarnings: number;
    uniqueParticipants: number;
    averageBidAmount: number;
    highestBid: number;
  }> {
    const [session, bids, gifts] = await Promise.all([
      this.getStreamSession(sessionId),
      this.getStreamBids(sessionId),
      this.getStreamGifts(sessionId),
    ]);

    const bidAmounts = bids.map((bid) => bid.amount);
    const giftAmounts = gifts.map((gift) => gift.amount);
    const allParticipantIds = [
      ...bids.map((bid) => bid.explorerId),
      ...gifts.map((gift) => gift.senderId),
    ];

    return {
      totalBids: bids.length,
      totalGifts: gifts.length,
      totalEarnings: [...bidAmounts, ...giftAmounts].reduce(
        (sum, amount) => sum + amount,
        0,
      ),
      uniqueParticipants: new Set(allParticipantIds).size,
      averageBidAmount:
        bidAmounts.length > 0
          ? bidAmounts.reduce((sum, amount) => sum + amount, 0) /
            bidAmounts.length
          : 0,
      highestBid: bidAmounts.length > 0 ? Math.max(...bidAmounts) : 0,
    };
  }

  /**
   * Clean up old ended sessions
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.streamSession.deleteMany({
      where: {
        status: 'ENDED',
        endTime: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
  async getCallHistoryByUserId(userId: string): Promise<any[]> {
    return this.prisma.callHistory.findMany({
      where: {
        OR: [{ influencerId: userId }, { explorerId: userId }],
      },
      include: {
        streamSession: true,
        influencer: true,
        explorer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createCallHistory(data: {
    streamSessionId: string;
    influencerId: string;
    explorerId?: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    earnings: number;
  }): Promise<any> {
    return this.prisma.callHistory.create({
      data: {
        streamSessionId: data.streamSessionId,
        influencerId: data.influencerId,
        explorerId: data.explorerId,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        earnings: data.earnings,
      },
    });
  }

  async getAcceptedBidForSession(sessionId: string): Promise<Bid | null> {
    try {
      const acceptedBid = await this.prisma.bid.findFirst({
        where: {
          streamSessionId: sessionId,
          status: 'ACCEPTED',
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      if (acceptedBid) {
        console.log(
          `✅ [StreamingRepository] Found accepted bid for session ${sessionId}: ${acceptedBid.id}`,
        );
      } else {
        console.log(
          `ℹ️ [StreamingRepository] No accepted bid found for session ${sessionId}`,
        );
      }

      return acceptedBid;
    } catch (error) {
      console.error(
        '❌ [StreamingRepository] Error getting accepted bid:',
        error,
      );
      throw error;
    }
  }

  async fetchProfileImage(profileImage: string | null): Promise<any> {
    return fetchProfileImage(profileImage);
  }

  async fetchPromotionalVideos(videos: string[]): Promise<any[]> {
    return fetchPromotionalVideos(videos);
  }

  async fetchInterests(interests: string[]): Promise<any[]> {
    return fetchInterests(interests);
  }

  async fetchZodiacSign(zodiacSign: string | null): Promise<any> {
    return fetchZodiacSign(zodiacSign);
  }

  /**
   * Get streams by influencer
   */
  async getStreamsByInfluencer(
    influencerId: string,
    limit: number = 10,
  ): Promise<StreamSessionWithIncludes[]> {
    return this.prisma.streamSession.findMany({
      where: {
        influencerId,
      },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get streams by explorer
   */
  async getStreamsByExplorer(
    explorerId: string,
    limit: number = 10,
  ): Promise<StreamSessionWithIncludes[]> {
    return this.prisma.streamSession.findMany({
      where: {
        currentExplorerId: explorerId,
      },
      include: {
        influencer: {
          include: {
            profile: true,
          },
        },
        currentExplorer: {
          include: {
            profile: true,
          },
        },
        bids: {
          include: {
            explorer: {
              include: {
                profile: true,
              },
            },
          },
        },
        gifts: {
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
            receiver: {
              include: {
                profile: true,
              },
            },
            giftType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  // Export types for use in other files
}
