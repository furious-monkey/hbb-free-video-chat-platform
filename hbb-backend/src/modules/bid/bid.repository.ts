// modules/bid/bid.repository.ts - Complete Bid Repository Implementation
import { PrismaClient, Bid, BidStatus, Prisma } from '@prisma/client';
import { CreateBidDTO } from './bid.dto';

// Define the actual return types from Prisma queries
type BidWithIncludes = Prisma.BidGetPayload<{
  include: {
    explorer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        profile: {
          select: {
            location: true,
            username: true,
          },
        },
      },
    },
    streamSession: {
      select: {
        id: true,
        influencerId: true,
        status: true,
        allowBids: true,
        currentExplorerId: true,
      },
    },
  },
}>;

type BidWithInfluencer = Prisma.BidGetPayload<{
  include: {
    explorer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        profile: {
          select: {
            location: true,
            username: true,
          },
        },
      },
    },
    streamSession: {
      select: {
        id: true,
        influencerId: true,
        status: true,
        allowBids: true,
        currentExplorerId: true,
        influencer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            profile: {
              select: {
                location: true,
                username: true,
              },
            },
          },
        },
      },
    },
  },
}>;

export class BidRepository {
  constructor(private prisma: PrismaClient) {}

  // Create a new bid
  async createBid(
    data: CreateBidDTO,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<BidWithIncludes> {
    const client = transactionManager || this.prisma;

    console.log('💰 [BidRepository] Creating bid:', data);

    try {
      const bid = await client.bid.create({
        data: {
          streamSessionId: data.streamSessionId,
          explorerId: data.explorerId,
          amount: data.amount,
          status: data.status || 'PENDING',
        },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
            },
          },
        },
      });

      console.log('✅ [BidRepository] Bid created successfully:', bid.id);
      return bid;
    } catch (error) {
      console.error('❌ [BidRepository] Error creating bid:', error);
      throw error;
    }
  }

  // Get bid by ID
  async getBidById(
    bidId: string,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<BidWithInfluencer | null> {
    const client = transactionManager || this.prisma;

    try {
      const bid = await client.bid.findUnique({
        where: { id: bidId },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
              influencer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  profile: {
                    select: {
                      location: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (bid) {
        console.log('📋 [BidRepository] Found bid:', bid.id);
      } else {
        console.warn('⚠️ [BidRepository] Bid not found:', bidId);
      }

      return bid;
    } catch (error) {
      console.error('❌ [BidRepository] Error getting bid by ID:', error);
      throw error;
    }
  }

  // Update bid status
  async updateBidStatus(
    bidId: string,
    status: BidStatus,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<BidWithInfluencer> {
    const client = transactionManager || this.prisma;

    console.log(`🔄 [BidRepository] Updating bid ${bidId} status to ${status}`);

    try {
      const updatedBid = await client.bid.update({
        where: { id: bidId },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
              influencer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  profile: {
                    select: {
                      location: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(
        `✅ [BidRepository] Bid ${bidId} status updated to ${status}`,
      );
      return updatedBid;
    } catch (error) {
      console.error('❌ [BidRepository] Error updating bid status:', error);
      throw error;
    }
  }

  // Get all bids for a session
  async getBidsForSession(
    sessionId: string,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<BidWithIncludes[]> {
    const client = transactionManager || this.prisma;

    try {
      const bids = await client.bid.findMany({
        where: { streamSessionId: sessionId },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
            },
          },
        },
        orderBy: [
          { amount: 'desc' }, // Highest bids first
          { createdAt: 'desc' }, // Most recent first for same amounts
        ],
      });

      console.log(
        `📋 [BidRepository] Found ${bids.length} bids for session ${sessionId}`,
      );
      return bids;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error getting bids for session:',
        error,
      );
      throw error;
    }
  }

  // Get pending bids for a session
  async getPendingBidsForSession(
    sessionId: string,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<BidWithIncludes[]> {
    const client = transactionManager || this.prisma;

    try {
      const pendingBids = await client.bid.findMany({
        where: {
          streamSessionId: sessionId,
          status: 'PENDING',
        },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
            },
          },
        },
        orderBy: [
          { amount: 'desc' }, // Highest bids first
          { createdAt: 'desc' }, // Most recent first for same amounts
        ],
      });

      console.log(
        `📋 [BidRepository] Found ${pendingBids.length} pending bids for session ${sessionId}`,
      );
      return pendingBids;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error getting pending bids for session:',
        error,
      );
      throw error;
    }
  }

  // Get bids for an explorer
  async getBidsForExplorer(explorerId: string): Promise<BidWithInfluencer[]> {
    try {
      const bids = await this.prisma.bid.findMany({
        where: { explorerId },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
              influencer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  profile: {
                    select: {
                      location: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        `📋 [BidRepository] Found ${bids.length} bids for explorer ${explorerId}`,
      );
      return bids;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error getting bids for explorer:',
        error,
      );
      throw error;
    }
  }

  // Get bids for an influencer (across all their sessions)
  async getBidsForInfluencer(influencerId: string): Promise<BidWithIncludes[]> {
    try {
      const bids = await this.prisma.bid.findMany({
        where: {
          streamSession: {
            influencerId: influencerId,
          },
        },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        `📋 [BidRepository] Found ${bids.length} bids for influencer ${influencerId}`,
      );
      return bids;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error getting bids for influencer:',
        error,
      );
      throw error;
    }
  }

  // Get highest bid for a session
  async getHighestBidForSession(sessionId: string): Promise<BidWithIncludes | null> {
    try {
      const highestBid = await this.prisma.bid.findFirst({
        where: {
          streamSessionId: sessionId,
          status: 'PENDING',
        },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
            },
          },
        },
        orderBy: { amount: 'desc' },
      });

      if (highestBid) {
        console.log(
          `📋 [BidRepository] Highest bid for session ${sessionId}: $${highestBid.amount}`,
        );
      } else {
        console.log(
          `📋 [BidRepository] No pending bids found for session ${sessionId}`,
        );
      }

      return highestBid;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error getting highest bid for session:',
        error,
      );
      throw error;
    }
  }

  // Delete a bid
  async deleteBid(
    bidId: string,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<BidWithIncludes> {
    const client = transactionManager || this.prisma;

    console.log(`🗑️ [BidRepository] Deleting bid: ${bidId}`);

    try {
      const deletedBid = await client.bid.delete({
        where: { id: bidId },
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
            },
          },
        },
      });

      console.log(`✅ [BidRepository] Bid ${bidId} deleted successfully`);
      return deletedBid;
    } catch (error) {
      console.error('❌ [BidRepository] Error deleting bid:', error);
      throw error;
    }
  }

  // Get bid statistics for a session
  async getBidStatsForSession(sessionId: string): Promise<{
    totalBids: number;
    pendingBids: number;
    acceptedBids: number;
    rejectedBids: number;
    highestBidAmount: number;
    averageBidAmount: number;
  }> {
    try {
      const bids = await this.prisma.bid.findMany({
        where: { streamSessionId: sessionId },
        select: {
          amount: true,
          status: true,
        },
      });

      const stats = {
        totalBids: bids.length,
        pendingBids: bids.filter((bid) => bid.status === 'PENDING').length,
        acceptedBids: bids.filter((bid) => bid.status === 'ACCEPTED').length,
        rejectedBids: bids.filter((bid) => bid.status === 'REJECTED').length,
        highestBidAmount:
          bids.length > 0 ? Math.max(...bids.map((bid) => bid.amount)) : 0,
        averageBidAmount:
          bids.length > 0
            ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length
            : 0,
      };

      console.log(
        `📊 [BidRepository] Bid stats for session ${sessionId}:`,
        stats,
      );
      return stats;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error getting bid stats for session:',
        error,
      );
      throw error;
    }
  }

  // Bulk update bid statuses (useful for rejecting all pending bids when one is accepted)
  async bulkUpdateBidStatus(
    bidIds: string[],
    status: BidStatus,
    transactionManager?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = transactionManager || this.prisma;

    console.log(
      `🔄 [BidRepository] Bulk updating ${bidIds.length} bids to status ${status}`,
    );

    try {
      const result = await client.bid.updateMany({
        where: {
          id: { in: bidIds },
        },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      console.log(
        `✅ [BidRepository] Bulk updated ${result.count} bids to status ${status}`,
      );
      return result.count;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error bulk updating bid statuses:',
        error,
      );
      throw error;
    }
  }

  // Get recent bids (across all sessions) for admin/monitoring
  async getRecentBids(limit: number = 50): Promise<BidWithInfluencer[]> {
    try {
      const recentBids = await this.prisma.bid.findMany({
        include: {
          explorer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              profile: {
                select: {
                  location: true,
                  username: true,
                },
              },
            },
          },
          streamSession: {
            select: {
              id: true,
              influencerId: true,
              status: true,
              allowBids: true,
              currentExplorerId: true,
              influencer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  profile: {
                    select: {
                      location: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      console.log(`📋 [BidRepository] Found ${recentBids.length} recent bids`);
      return recentBids;
    } catch (error) {
      console.error('❌ [BidRepository] Error getting recent bids:', error);
      throw error;
    }
  }

  // Check if explorer has pending bid for session
  async hasExplorerPendingBidForSession(
    explorerId: string,
    sessionId: string,
  ): Promise<boolean> {
    try {
      const existingBid = await this.prisma.bid.findFirst({
        where: {
          explorerId,
          streamSessionId: sessionId,
          status: 'PENDING',
        },
      });

      const hasPendingBid = !!existingBid;
      console.log(
        `🔍 [BidRepository] Explorer ${explorerId} has pending bid for session ${sessionId}: ${hasPendingBid}`,
      );

      return hasPendingBid;
    } catch (error) {
      console.error(
        '❌ [BidRepository] Error checking for pending bid:',
        error,
      );
      throw error;
    }
  }

  // Clean up old rejected/expired bids (maintenance function)
  async cleanupOldBids(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(
      `🧹 [BidRepository] Cleaning up bids older than ${daysOld} days (before ${cutoffDate.toISOString()})`,
    );

    try {
      const result = await this.prisma.bid.deleteMany({
        where: {
          AND: [
            { createdAt: { lt: cutoffDate } },
            {
              OR: [
                { status: 'REJECTED' },
                {
                  AND: [
                    { status: 'PENDING' },
                    {
                      streamSession: {
                        status: 'ENDED',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      console.log(`✅ [BidRepository] Cleaned up ${result.count} old bids`);
      return result.count;
    } catch (error) {
      console.error('❌ [BidRepository] Error cleaning up old bids:', error);
      throw error;
    }
  }

  // Export types
}
export type { BidWithIncludes, BidWithInfluencer };