// earnings.service.ts - Updated version with distinct bid earnings type
import { Service } from 'typedi';
import { PrismaClient, StreamStatus } from '@prisma/client';
import { 
  IEarningsService, 
  IEarningsUpdate, 
  IEarningsSummary, 
  IEarningRecord,
  ITimeBasedEarningsCalculation 
} from './earnings.interface';
import { fetchProfileImage } from '../../utils/media.utils';

@Service()
export class EarningsService implements IEarningsService {
  private prisma: PrismaClient;
  private readonly BID_DURATION_MINUTES = 30; // Bid amount covers 30 minutes

  constructor() {
    this.prisma = new PrismaClient();
  }

  async updateStreamEarnings(data: IEarningsUpdate): Promise<void> {
    try {
      console.log(`💰 [EarningsService] Updating earnings:`, data);

      // Get the stream session
      const session = await this.prisma.streamSession.findUnique({
        where: { id: data.streamSessionId },
        include: {
          influencer: {
            include: {
              profile: true
            }
          },
          bids: {
            where: { status: 'ACCEPTED' },
            orderBy: { updatedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!session) {
        throw new Error('Stream session not found');
      }

      let actualAmount = data.amount;
      let transactionType = `STREAM_${data.type}`;

      // For bid-based earnings, calculate pro-rated amount
      if (data.type === 'BID_ACCEPTED' && data.metadata?.bidId) {
        // Don't record the full bid amount immediately
        // Instead, just record a transaction marking the bid acceptance
        await this.prisma.transaction.create({
          data: {
            userId: session.influencerId,
            amount: 0, // No immediate earnings from bid acceptance
            currency: 'USD',
            type: 'BID_ACCEPTED',
            status: 'COMPLETED',
            description: `Bid accepted for ${this.BID_DURATION_MINUTES} minutes of streaming`,
            metadata: {
              streamSessionId: data.streamSessionId,
              bidId: data.metadata.bidId,
              bidAmount: data.amount,
              maxDurationMinutes: this.BID_DURATION_MINUTES,
              explorerId: data.metadata.explorerId
            }
          }
        });

        console.log(`✅ [EarningsService] Bid acceptance recorded. Earnings will be calculated based on actual duration.`);
        return; // Don't update session earnings yet
      }

      // For time-based earnings calculation at stream end
      if (data.type === 'TIME_BASED' && session.bids.length > 0 && data.metadata?.bidId) {
        const acceptedBid = session.bids[0];
        const bidAmount = acceptedBid.amount;
        
        // Calculate actual earnings based on duration
        const durationMinutes = (data.metadata?.duration || 0) / 60;
        const maxMinutes = this.BID_DURATION_MINUTES;
        
        // Pro-rate the bid amount based on actual vs promised duration
        actualAmount = this.calculateProRatedBidEarnings(bidAmount, durationMinutes, maxMinutes);
        
        // Use distinct type for bid earnings
        transactionType = 'STREAM_BID_EARNINGS';
        
        console.log(`💰 [EarningsService] Pro-rated bid earnings calculation:`, {
          bidAmount,
          durationMinutes: durationMinutes.toFixed(2),
          maxMinutes,
          actualEarnings: actualAmount.toFixed(2),
          percentage: ((durationMinutes / maxMinutes) * 100).toFixed(2) + '%'
        });
      } else if (data.type === 'TIME_BASED') {
        // Regular time-based earnings (no bid)
        transactionType = 'STREAM_TIME_BASED';
      }

      // Update the stream session earnings
      const currentEarnings = session.earnings || 0;
      const newEarnings = currentEarnings + actualAmount;

      await this.prisma.streamSession.update({
        where: { id: data.streamSessionId },
        data: {
          earnings: newEarnings
        }
      });

      // Create a transaction record for tracking
      await this.prisma.transaction.create({
        data: {
          userId: session.influencerId,
          amount: actualAmount,
          currency: 'USD',
          type: transactionType,
          status: 'COMPLETED',
          description: this.generateEarningDescription(data, actualAmount, transactionType),
          metadata: {
            streamSessionId: data.streamSessionId,
            earningType: data.type,
            ...data.metadata,
            // For bid earnings, include additional metadata
            ...(transactionType === 'STREAM_BID_EARNINGS' && {
              bidId: data.metadata?.bidId,
              originalBidAmount: data.metadata?.originalBidAmount,
              durationMinutes: (data.metadata?.duration || 0) / 60,
              wasProRated: ((data.metadata?.duration || 0) / 60) < this.BID_DURATION_MINUTES
            })
          }
        }
      });

      console.log(`✅ [EarningsService] Earnings updated: +$${actualAmount.toFixed(2)} (Total: $${newEarnings.toFixed(2)})`);

      // Update call history if needed
      if (data.type === 'TIME_BASED' || transactionType === 'STREAM_BID_EARNINGS') {
        await this.updateCallHistoryEarnings(session.id, newEarnings);
      }

    } catch (error) {
      console.error('❌ [EarningsService] Error updating earnings:', error);
      throw error;
    }
  }

  // New method to calculate earnings when a stream with accepted bid ends
  async calculateAndRecordBidEarnings(sessionId: string): Promise<ITimeBasedEarningsCalculation> {
    try {
      const session = await this.prisma.streamSession.findUnique({
        where: { id: sessionId },
        include: {
          bids: {
            where: { status: 'ACCEPTED' },
            orderBy: { updatedAt: 'desc' },
            take: 1
          },
          callHistories: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!session || session.bids.length === 0) {
        return {
          bidAmount: 0,
          actualDurationMinutes: 0,
          maxDurationMinutes: this.BID_DURATION_MINUTES,
          calculatedEarnings: 0,
          wasProRated: false
        };
      }

      const acceptedBid = session.bids[0];
      const callHistory = session.callHistories[0];
      
      // Calculate actual duration
      let durationSeconds = 0;
      if (callHistory?.duration) {
        durationSeconds = callHistory.duration;
      } else if (session.duration) {
        durationSeconds = session.duration;
      } else if (session.startTime && session.endTime) {
        durationSeconds = Math.floor(
          (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
        );
      }

      const durationMinutes = durationSeconds / 60;
      const proRatedEarnings = this.calculateProRatedBidEarnings(
        acceptedBid.amount, 
        durationMinutes, 
        this.BID_DURATION_MINUTES
      );

      // Record the earnings
      await this.updateStreamEarnings({
        streamSessionId: sessionId,
        amount: proRatedEarnings,
        type: 'TIME_BASED',
        metadata: {
          duration: durationSeconds,
          bidId: acceptedBid.id,
          originalBidAmount: acceptedBid.amount,
          explorerId: acceptedBid.explorerId
        }
      });

      return {
        bidAmount: acceptedBid.amount,
        actualDurationMinutes: durationMinutes,
        maxDurationMinutes: this.BID_DURATION_MINUTES,
        calculatedEarnings: proRatedEarnings,
        wasProRated: durationMinutes < this.BID_DURATION_MINUTES
      };

    } catch (error) {
      console.error('❌ [EarningsService] Error calculating bid earnings:', error);
      throw error;
    }
  }

  private calculateProRatedBidEarnings(
    bidAmount: number, 
    actualMinutes: number, 
    maxMinutes: number
  ): number {
    // If the call lasted longer than the bid duration, they get the full amount
    if (actualMinutes >= maxMinutes) {
      return bidAmount;
    }
    
    // Otherwise, calculate pro-rated amount
    const proRatedAmount = (actualMinutes / maxMinutes) * bidAmount;
    
    // Round to 2 decimal places
    return Math.round(proRatedAmount * 100) / 100;
  }

  async getEarningsSummary(influencerId: string): Promise<IEarningsSummary> {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all earnings transactions
      const [
        totalEarnings,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        earningsByType,
        recentTransactions
      ] = await Promise.all([
        // Total earnings
        this.prisma.transaction.aggregate({
          where: {
            userId: influencerId,
            type: { startsWith: 'STREAM_' },
            status: 'COMPLETED',
            amount: { gt: 0 } // Only count actual earnings
          },
          _sum: { amount: true }
        }),
        
        // Today's earnings
        this.prisma.transaction.aggregate({
          where: {
            userId: influencerId,
            type: { startsWith: 'STREAM_' },
            status: 'COMPLETED',
            amount: { gt: 0 },
            createdAt: { gte: todayStart }
          },
          _sum: { amount: true }
        }),
        
        // Weekly earnings
        this.prisma.transaction.aggregate({
          where: {
            userId: influencerId,
            type: { startsWith: 'STREAM_' },
            status: 'COMPLETED',
            amount: { gt: 0 },
            createdAt: { gte: weekStart }
          },
          _sum: { amount: true }
        }),
        
        // Monthly earnings
        this.prisma.transaction.aggregate({
          where: {
            userId: influencerId,
            type: { startsWith: 'STREAM_' },
            status: 'COMPLETED',
            amount: { gt: 0 },
            createdAt: { gte: monthStart }
          },
          _sum: { amount: true }
        }),
        
        // Earnings by type
        this.getEarningsByType(influencerId),
        
        // Recent earnings with details
        this.getDetailedEarnings(influencerId, { limit: 10 })
      ]);

      return {
        totalEarnings: totalEarnings._sum.amount || 0,
        todayEarnings: todayEarnings._sum.amount || 0,
        weeklyEarnings: weeklyEarnings._sum.amount || 0,
        monthlyEarnings: monthlyEarnings._sum.amount || 0,
        earningsByType,
        recentEarnings: recentTransactions
      };
    } catch (error) {
      console.error('❌ [EarningsService] Error getting earnings summary:', error);
      throw error;
    }
  }

  async getDetailedEarnings(
    influencerId: string, 
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      limit?: number;
    }
  ): Promise<IEarningRecord[]> {
    try {
      const whereClause: any = {
        userId: influencerId,
        type: { startsWith: 'STREAM_' },
        status: 'COMPLETED',
        amount: { gt: 0 } // Only show actual earnings
      };

      if (filters?.startDate) {
        whereClause.createdAt = { ...whereClause.createdAt, gte: filters.startDate };
      }
      if (filters?.endDate) {
        whereClause.createdAt = { ...whereClause.createdAt, lte: filters.endDate };
      }
      if (filters?.type) {
        whereClause.type = `STREAM_${filters.type}`;
      }

      const transactions = await this.prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50
      });

      // Get detailed information for each transaction
      const detailedEarnings = await Promise.all(
        transactions.map(async (transaction) => {
          const metadata = transaction.metadata as any;
          const streamSessionId = metadata?.streamSessionId;
          
          // Get related data based on transaction type
          let giftDetails;
          let explorerDetails;
          let streamDetails;
          let bidDetails;

          if (streamSessionId) {
            const session = await this.prisma.streamSession.findUnique({
              where: { id: streamSessionId },
              include: {
                gifts: {
                  where: metadata.giftId ? { id: metadata.giftId } : undefined,
                  include: {
                    giftType: true,
                    sender: {
                      include: {
                        profile: true
                      }
                    }
                  },
                  take: 1
                },
                bids: {
                  where: metadata.bidId ? { id: metadata.bidId } : undefined,
                  include: {
                    explorer: {
                      include: {
                        profile: true
                      }
                    }
                  },
                  take: 1
                }
              }
            });

            if (session) {
              streamDetails = {
                duration: session.duration || undefined,
                startTime: session.startTime || undefined,
                endTime: session.endTime || undefined
              };

              if (session.gifts.length > 0) {
                const gift = session.gifts[0];
                giftDetails = {
                  giftType: gift.giftType.name,
                  giftImage: gift.giftType.imageUrl
                };

                const senderImage = await fetchProfileImage(gift.sender.profileImage);
                explorerDetails = {
                  username: gift.sender.profile?.username || 'Unknown',
                  profileImage: senderImage?.url || senderImage?.Location || undefined,
                  location: gift.sender.profile?.location || undefined
                };
              }

              if (session.bids.length > 0 && transaction.type === 'STREAM_BID_EARNINGS') {
                const bid = session.bids[0];
                bidDetails = {
                  originalBidAmount: metadata.originalBidAmount || bid.amount,
                  wasProRated: metadata.wasProRated || false,
                  durationMinutes: metadata.durationMinutes || (metadata.duration ? (metadata.duration / 60).toFixed(2) : undefined)
                };

                if (!explorerDetails) {
                  const bidderImage = await fetchProfileImage(bid.explorer.profileImage);
                  explorerDetails = {
                    username: bid.explorer.profile?.username || 'Unknown',
                    profileImage: bidderImage?.url || bidderImage?.Location || undefined,
                    location: bid.explorer.profile?.location || undefined
                  };
                }
              }
            }
          }

          // If no explorer details from gift/bid, try to get from metadata
          if (!explorerDetails && metadata?.explorerId) {
            const explorer = await this.prisma.user.findUnique({
              where: { id: metadata.explorerId },
              include: { profile: true }
            });

            if (explorer) {
              const explorerImage = await fetchProfileImage(explorer.profileImage);
              explorerDetails = {
                username: explorer.profile?.username || 'Unknown',
                profileImage: explorerImage?.url || explorerImage?.Location || undefined,
                location: explorer.profile?.location || undefined
              };
            }
          }

          return {
            id: transaction.id,
            streamSessionId: streamSessionId || '',
            influencerId: influencerId,
            explorerId: metadata?.explorerId,
            amount: transaction.amount,
            type: transaction.type.replace('STREAM_', ''),
            description: transaction.description || undefined,
            createdAt: transaction.createdAt,
            giftDetails,
            explorerDetails,
            streamDetails,
            bidDetails
          };
        })
      );

      return detailedEarnings;
    } catch (error) {
      console.error('❌ [EarningsService] Error getting detailed earnings:', error);
      throw error;
    }
  }

  async calculateTimeBasedEarnings(sessionId: string, duration: number): Promise<number> {
    try {
      const session = await this.prisma.streamSession.findUnique({
        where: { id: sessionId },
        include: {
          influencer: {
            include: {
              profile: true
            }
          },
          bids: {
            where: { status: 'ACCEPTED' },
            orderBy: { updatedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!session) {
        throw new Error('Stream session not found');
      }

      // If there's an accepted bid, use pro-rated calculation
      if (session.bids.length > 0) {
        const acceptedBid = session.bids[0];
        const minutes = duration / 60;
        return this.calculateProRatedBidEarnings(acceptedBid.amount, minutes, this.BID_DURATION_MINUTES);
      }

      // Otherwise, use regular call rate (if no bids)
      const callRateStr = session.influencer.profile?.callRate || '0';
      const callRate = parseFloat(callRateStr);
      const minutes = duration / 60;
      const earnings = minutes * callRate;

      return Math.round(earnings * 100) / 100;
    } catch (error) {
      console.error('❌ [EarningsService] Error calculating time-based earnings:', error);
      throw error;
    }
  }

  private async getEarningsByType(influencerId: string): Promise<{
    gifts: number;
    bids: number;
    timeBased: number;
    tips: number;
  }> {
    const types = ['GIFT', 'TIME_BASED', 'TIP', 'BID_EARNINGS'];
    const results = await Promise.all(
      types.map(type => 
        this.prisma.transaction.aggregate({
          where: {
            userId: influencerId,
            type: `STREAM_${type}`,
            status: 'COMPLETED',
            amount: { gt: 0 }
          },
          _sum: { amount: true }
        })
      )
    );

    return {
      gifts: results[0]._sum.amount || 0,
      timeBased: results[1]._sum.amount || 0,
      tips: results[2]._sum.amount || 0,
      bids: results[3]._sum.amount || 0  // Now using STREAM_BID_EARNINGS
    };
  }

  private generateEarningDescription(data: IEarningsUpdate, actualAmount?: number, transactionType?: string): string {
    // Use transaction type if provided, otherwise use data type
    const type = transactionType === 'STREAM_BID_EARNINGS' ? 'BID_EARNINGS' : data.type;
    
    switch (type) {
      case 'GIFT':
        return `Gift received during stream`;
      case 'BID_ACCEPTED':
        return `Bid accepted for ${this.BID_DURATION_MINUTES} minutes of streaming`;
      case 'BID_EARNINGS':
        if (data.metadata?.duration) {
          const minutes = data.metadata.duration / 60;
          const percentage = (minutes / this.BID_DURATION_MINUTES) * 100;
          return `Earnings from ${minutes.toFixed(1)} minutes of streaming (${percentage.toFixed(0)}% of bid duration)`;
        }
        return `Earnings from bid-based streaming`;
      case 'TIME_BASED':
        return `Earnings from ${data.metadata?.duration ? Math.round(data.metadata.duration / 60) : 0} minutes of streaming`;
      case 'TIP':
        return `Tip received during stream`;
      default:
        return `Stream earnings`;
    }
  }

  private async updateCallHistoryEarnings(sessionId: string, earnings: number): Promise<void> {
    try {
      // Find the most recent call history for this session
      const callHistory = await this.prisma.callHistory.findFirst({
        where: {
          streamSessionId: sessionId,
          endTime: null // Still active
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (callHistory) {
        await this.prisma.callHistory.update({
          where: { id: callHistory.id },
          data: { earnings }
        });
      }
    } catch (error) {
      console.error('❌ [EarningsService] Error updating call history earnings:', error);
      // Don't throw - this is a secondary operation
    }
  }
}