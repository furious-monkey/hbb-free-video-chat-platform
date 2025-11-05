// backend/src/modules/auth/auth.service.ts
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ResendOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  logoutDto,
} from './auth.dto';
import crypto from 'crypto';
import mailgun from 'mailgun-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { APIError } from '../../middleware/error/appError';
import { ErrorHandler } from '../../middleware/error/errorHandler';
import { logger } from '../../config/logger';
import { ValidUserRoles } from './auth.enum';
import { getRedisClient } from '../../config/redis';

const prisma = new PrismaClient();
const errorHandler = new ErrorHandler(logger);
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY as string,
  domain: process.env.MAILGUN_DOMAIN as string,
});

// ✅ Helper function to get JWT secret with proper error handling
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

// ✅ Helper function to get refresh token expiration
const getRefreshTokenExpiration = (): string => {
  return process.env.REFRESH_TOKEN_EXPIRATION || '7d';
};

// Function to load and compile Handlebars template
const compileTemplate = (templateName: string, data: any) => {
  const filePath = path.join(__dirname, '../../emails', `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);
  return template(data);
};

@Service()
export default class AuthService {
  async login(payload: LoginDto): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        throw new APIError('User not found', 'login', 404);
      }

      const isPasswordMatch = await bcrypt.compare(
        payload.password,
        user.password,
      );
      if (!isPasswordMatch) {
        throw new APIError('Invalid credentials', 'login', 401);
      }

      if (!user.isEmailVerified) {
        throw new APIError('Email not verified', 'login', 403, {
          email: user.email,
          userRole: user.userRole,
        });
      }

      const jwtSecret = getJWTSecret();

      const accessToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '1h',
      });

      const refreshToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '180d',
      });

      // ✅ Mark user as online in Redis
      await getRedisClient().set(`user:online:${user.id}`, '1', { EX: 60 * 5 });
      console.log(`🔵 Logged in user online key set: user:online:${user.id}`);

      return {
        token: { accessToken, refreshToken },
        user: {
          ...user,
          password: undefined, // Don't send password back
        },
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw error;
    }
  }

  async register(payload: RegisterDto): Promise<any> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (existingUser) {
        throw new APIError('User already exists', 'register', 409);
      }

      // Enum validation
      const validUserRoles = Object.values(ValidUserRoles).filter(
        (value) => typeof value === 'string',
      );
      if (!validUserRoles.includes(payload.userRole)) {
        throw new APIError('Invalid user role', 'register', 400);
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedPassword = await bcrypt.hash(payload.password, 10);

      const userData: any = {
        userRole: payload.userRole,
        email: payload.email,
        password: hashedPassword,
        firstName: payload.firstName || null,
        lastName: payload.lastName || null,
        age: payload.age || null,
        gender: payload.gender || null,
        referralCode: payload.referralCode || null,
        dateOfBirth: payload.dateOfBirth || null,
        profileImage: payload.profileImage || null,
        isOnline: false,
        isBanned: false,
        isEmailVerified: false,
        isDeleted: false,
        otp: otp,
        otpExpires: new Date(Date.now() + 3600000), // 1 hour expiry
      };

      if (payload.phone) {
        userData.phone = payload.phone;
      }

      const user = await prisma.user.create({ data: userData });
      const htmlContent = compileTemplate('verificationEmail', {
        otp,
        email: payload.email,
      });

      const data = {
        from: process.env.MAILGUN_SENDER_EMAIL as string,
        to: payload.email,
        subject: 'Email Verification',
        html: htmlContent,
      };

      const mg = mailgun({
        apiKey: process.env.MAILGUN_API_KEY as string,
        domain: process.env.MAILGUN_DOMAIN as string,
      });

      mg.messages().send(data);

      return {
        ...user,
        password: undefined, // Don't send password back
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw error;
    }
  }

  async verifyEmail(payload: VerifyEmailDto): Promise<any> {
    try {
      const user = await prisma.user.findFirst({
        where: { otp: payload.otp },
      });

      if (!user) {
        const error = new APIError('Invalid OTP', 'verifyEmail', 400);
        await errorHandler.handleError(error);
        throw error;
      }

      if (user.otpExpires && new Date() > user.otpExpires) {
        const error = new APIError('OTP has expired', 'verifyEmail', 400);
        await errorHandler.handleError(error);
        throw error;
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          otp: null,
          otpExpires: null,
        },
      });

      // ✅ Fixed: Use helper function for JWT secret
      const jwtSecret = getJWTSecret();

      const accessToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '1h',
      });

      // ✅ FIXED: Remove Number() wrapper - keep as string
      const refreshToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '180d',
      });

      return {
        token: { accessToken, refreshToken },
        user: {
          ...updatedUser,
          password: undefined, // Don't send password back
        },
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw error;
    }
  }

  async resendOtp(payload: ResendOtpDto): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        throw new APIError('User not found', 'resendOtp', 404);
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          otp,
          otpExpires: new Date(Date.now() + 3600000),
        },
      });

      const htmlContent = compileTemplate('resendOTP', {
        otp,
        email: payload.email,
      });

      const data = {
        from: process.env.MAILGUN_SENDER_EMAIL as string,
        to: payload.email,
        subject: 'Resend OTP',
        html: htmlContent,
      };

      const mg = mailgun({
        apiKey: process.env.MAILGUN_API_KEY as string,
        domain: process.env.MAILGUN_DOMAIN as string,
      });

      mg.messages().send(data);

      return {
        ...updatedUser,
        password: undefined, // Don't send password back
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw error;
    }
  }

  async refreshToken(payload: RefreshTokenDto): Promise<any> {
    const { refreshToken } = payload;

    if (!refreshToken) {
      throw new APIError('Refresh token is required', 'refreshToken', 400);
    }

    try {
      // ✅ Fixed: Use helper function for JWT secret
      const jwtSecret = getJWTSecret();

      const decoded = jwt.verify(refreshToken, jwtSecret) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new APIError('User not found', 'refreshToken', 404);
      }

      // ✅ Fixed: Use helper function for JWT secret
      const accessToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '1h',
      });

      const newRefreshToken = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: '180d',
      });

      logger.info(`User ${user.id} generated a new token`);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Invalid refresh token', 'refreshToken', 401);
    }
  }

  async logout(payload: logoutDto): Promise<any> {
    const { userId } = payload;
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false },
      });

      if (!user) {
        throw new APIError('User not found', 'logout', 404);
      }

      // ✅ Remove user from Redis
      await getRedisClient().del(`user:online:${userId}`);

      logger.info(`User ${userId} logged out`);

      return { message: 'Logout successful' };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'logout', 500);
    }
  }

  async forgotPassword(payload: ForgotPasswordDto): Promise<any> {
    const { email } = payload;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new APIError('User not found', 'forgotPassword', 404);
      }
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${user.id}`;
      const htmlContent = compileTemplate('resetPassword', { resetLink });

      const data = {
        from: process.env.MAILGUN_SENDER_EMAIL as string,
        to: email,
        subject: 'Password Reset',
        html: htmlContent,
      };
      mg.messages().send(data, (error: any, body: any) => {
        if (error) {
          logger.error('Error sending verification email:', error);
          throw new APIError('Internal Server Error', 'forgotPassword', 500);
        } else {
          logger.info('Verification email sent:', body);
        }
      });
      return {
        message: 'A link has been sent to your email, please click to verify',
        alert: true,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'forgotPassword', 500);
    }
  }

  async resetPassword(payload: ResetPasswordDto): Promise<any> {
    const { password, userId } = payload;
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new APIError('User not found', 'resetPassword', 404);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info(`User ${userId} reset their password`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      await errorHandler.handleError(error as Error);
      throw new APIError('Internal server error', 'resetPassword', 500);
    }
  }
}
