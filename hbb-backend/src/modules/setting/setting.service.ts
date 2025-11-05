import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { updateUserDto, DeleteAccountDto, ChangePasswordDto, BlockUserDto, UnblockUserDto, UpdateNotificationSettingsDto, AddCardDto, UpdateCardDto } from './setting.dto';
import { APIError } from '../../middleware/error/appError';
import { ErrorHandler } from '../../middleware/error/errorHandler';
import { logger } from '../../config/logger';
import bcrypt from 'bcrypt';


const prisma = new PrismaClient();
const errorHandler = new ErrorHandler(logger);

@Service()
export default class SettingService {
  async updateUser(payload: updateUserDto): Promise<any> {
    const { userId, userDetails } = payload;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userDetails,
      });

      if (!updatedUser) {
        throw new APIError('User not found', 'updateUser', 404);
      }

      logger.info(`User ${userId} updated their details`);

      return {
        _id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        age: updatedUser.age,
        gender: updatedUser.gender,
        dateOfBirth: updatedUser.dateOfBirth,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        promotionalVideo: updatedUser.promotionalVideo,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'updateUser', 500);
    }
  }

  async deleteAccount(payload: DeleteAccountDto): Promise<any> {
    const { userId } = payload;

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true },
      });

      if (!updatedUser) {
        throw new APIError('User not found', 'deleteAccount', 404);
      }

      logger.info(`User ${userId} marked as deleted`);

      return updatedUser;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'deleteAccount', 500);
    }
  }

  async changePassword(payload: ChangePasswordDto): Promise<any> {
    const { userId, currentPassword, newPassword } = payload;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new APIError('User not found', 'changePassword', 404);
      }

      const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordMatch) {
        throw new APIError('Current password is incorrect', 'changePassword', 401);
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info(`User ${userId} changed their password`);

      return updatedUser;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'changePassword', 500);
    }
  }

  async blockUser(payload: BlockUserDto): Promise<any> {
    const { userId, blockedUserId } = payload;

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          blockedUsers: {
            push: blockedUserId,
          },
        },
      });

      if (!user) {
        throw new APIError('User not found', 'blockUser', 404);
      }

      logger.info(`User ${userId} blocked user ${blockedUserId}`);

      return user;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'blockUser', 500);
    }
  }

  async unblockUser(payload: UnblockUserDto): Promise<any> {
    const { userId, blockedUserId } = payload;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new APIError('User not found', 'unblockUser', 404);
      }

      const updatedBlockedUsers = user.blockedUsers.filter(id => id !== blockedUserId);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          blockedUsers: {
            set: updatedBlockedUsers,
          },
        },
      });

      logger.info(`User ${userId} unblocked user ${blockedUserId}`);

      return updatedUser;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'unblockUser', 500);
    }
  }

  async getBlockedUsers(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { blockedUsers: true },
      });

      if (!user) {
        throw new APIError('User not found', 'getBlockedUsers', 404);
      }

      const blockedUsers = await prisma.user.findMany({
        where: {
          id: {
            in: user.blockedUsers,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      });

      return blockedUsers;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'getBlockedUsers', 500);
    }
  }

  async updateNotificationSettings(payload: UpdateNotificationSettingsDto): Promise<any> {
    const { userId, emailNotifications, pushNotifications } = payload;

    try {
      const data: any = {};
      if (emailNotifications !== undefined) {
        data.emailNotifications = emailNotifications;
      }
      if (pushNotifications !== undefined) {
        data.pushNotifications = pushNotifications;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
      });

      if (!updatedUser) {
        throw new APIError('User not found', 'updateNotificationSettings', 404);
      }

      logger.info(`User ${userId} updated notification settings`);

      return updatedUser;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'updateNotificationSettings', 500);
    }
  }

  async addCard(payload: AddCardDto): Promise<any> {
    const { userId, cardNumber, expiryDate, cvv, nameOnCard } = payload;

    try {
      const newCard = await prisma.card.create({
        data: {
          userId,
          cardNumber,
          expiryDate,
          cvv,
          nameOnCard,
        },
      });

      logger.info(`User ${userId} added a new card`);

      return newCard;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'addCard', 500);
    }
  }

  async updateCard(payload: UpdateCardDto): Promise<any> {
    const { userId, cardId, cardNumber, expiryDate, cvv, nameOnCard } = payload;

    try {
      const existingCard = await prisma.card.findUnique({
        where: { id: cardId },
      });

      if (!existingCard || existingCard.userId !== userId) {
        throw new APIError('Card not found or access denied', 'updateCard', 404);
      }

      const updatedCard = await prisma.card.update({
        where: { id: cardId },
        data: {
          cardNumber: cardNumber || existingCard.cardNumber,
          expiryDate: expiryDate || existingCard.expiryDate,
          cvv: cvv || existingCard.cvv,
          nameOnCard: nameOnCard || existingCard.nameOnCard,
        },
      });

      logger.info(`User ${userId} updated card ${cardId}`);

      return updatedCard;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'updateCard', 500);
    }
  }

  async getAllCards(userId: string): Promise<any> {
    try {
      const cards = await prisma.card.findMany({
        where: { userId },
      });

      if (!cards.length) {
        throw new APIError('No cards found for this user', 'getAllCards', 404);
      }

      logger.info(`Fetched all cards for user ${userId}`);

      return cards;
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'getAllCards', 500);
    }
  }
}
