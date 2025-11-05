// backend/src/modules/transaction/transaction.service.ts
import { Service } from 'typedi';
import { PrismaClient, Transaction, Prisma } from '@prisma/client';

interface TransactionFilters {
  userId: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

interface TransactionWithUser extends Transaction {
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profile: {
      username: string | null;
    } | null;
  };
}

@Service()
export class TransactionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getTransactions(filters: TransactionFilters) {
    try {
      const where: Prisma.TransactionWhereInput = {
        userId: filters.userId,
      };

      // Add date filters
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Add type filter
      if (filters.type) {
        where.type = filters.type;
      }

      // Add status filter
      if (filters.status) {
        where.status = filters.status;
      }

      const limit = filters.limit || 20;

      // Build cursor for pagination
      const cursorOptions: any = {};
      if (filters.cursor) {
        cursorOptions.cursor = { id: filters.cursor };
        cursorOptions.skip = 1;
      }

      // Fetch transactions with pagination
      const transactions = await this.prisma.transaction.findMany({
        where,
        take: limit + 1, // Fetch one extra to check if there's a next page
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
        ...cursorOptions,
      });

      // Check if there's a next page
      const hasNextPage = transactions.length > limit;
      const transactionsToReturn = hasNextPage ? transactions.slice(0, -1) : transactions;
      const nextCursor = hasNextPage ? transactionsToReturn[transactionsToReturn.length - 1].id : null;

      // Calculate totals
      const totals = await this.calculateTotals(filters.userId, where);

      return {
        transactions: transactionsToReturn,
        nextCursor,
        hasNextPage,
        totalEarned: totals.earned,
        totalSpent: totals.spent,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getTransactionById(id: string, userId: string) {
    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  async createTransaction(data: {
    userId: string;
    amount: number;
    currency?: string;
    type: string;
    status: string;
    stripePaymentId?: string;
    paymentMethod?: string;
    description?: string;
    metadata?: any;
  }) {
    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          ...data,
          currency: data.currency || 'USD',
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(id: string, status: string) {
    try {
      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: { status },
      });

      return transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  private async calculateTotals(userId: string, where: Prisma.TransactionWhereInput) {
    try {
      // Define which transaction types are considered "earned" vs "spent"
      const earnedTypes = ['GIFT', 'LIVE_STREAM', 'GIFT_RECEIVED'];
      const spentTypes = ['SIGNUP_FEE', 'MEMBERSHIP_FEE', 'GIFT_SENT'];

      // Calculate earned total
      const earnedResult = await this.prisma.transaction.aggregate({
        where: {
          ...where,
          type: { in: earnedTypes },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      });

      // Calculate spent total
      const spentResult = await this.prisma.transaction.aggregate({
        where: {
          ...where,
          type: { in: spentTypes },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      });

      return {
        earned: earnedResult._sum.amount || 0,
        spent: spentResult._sum.amount || 0,
      };
    } catch (error) {
      console.error('Error calculating totals:', error);
      return { earned: 0, spent: 0 };
    }
  }

  async generateStatementData(userId: string, startDate?: string, endDate?: string) {
    try {
      const filters: TransactionFilters = {
        userId,
        startDate,
        endDate,
        status: 'COMPLETED',
      };

      const { transactions, totalEarned, totalSpent } = await this.getTransactions(filters);

      // Get user information
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          profile: {
            select: {
              username: true,
              location: true,
            },
          },
        },
      });

      return {
        transactions,
        accountHolder: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
        dateRange: `${startDate || 'Beginning'} - ${endDate || 'Present'}`,
        moneyEarned: totalEarned,
        moneySpent: totalSpent,
        location: user?.profile?.location || 'Not specified',
      };
    } catch (error) {
      console.error('Error generating statement data:', error);
      throw error;
    }
  }
}