// modules/user/user.repository.ts - User repository for handling user details, referral code, discovery, blocking, unblocking, and profile completion
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { IUser } from './user.interface';

const prisma = new PrismaClient();

@Service()
export default class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    if (!data.userRole) {
      throw new Error('User role must be provided to create a user');
    }
    return prisma.user.create({ data: data as any });
  }

  async findByOtp(otp: string): Promise<IUser | null> {
    return prisma.user.findFirst({ where: { otp } });
  }

  async findById(userId: string): Promise<IUser | null> {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  async updateUser(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    return prisma.user.update({ where: { id: userId }, data: data as any });
  }

  async findUsersByReferralCode(referralCode: string): Promise<IUser[]> {
    return prisma.user.findMany({ where: { referralCode } });
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        blockedUsers: {
          push: blockedUserId,
        },
      },
    });
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const updatedBlockedUsers = user.blockedUsers.filter(id => id !== blockedUserId);
      await prisma.user.update({
        where: { id: userId },
        data: {
          blockedUsers: updatedBlockedUsers,
        },
      });
    }
  }
}
