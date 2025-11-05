import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { STATUS_CODES } from './error/baseError';
import env from '../config/env';
import { APIError } from './error/appError';

type typeOfUserObject = {
  id: string;
  email: string;
  userRole: 'INFLUENCER' | 'EXPLORER' | 'ADMIN' | 'AGENCY';
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  gender?: string | null;
  referralCode?: string | null;
  ownedReferralCode?: string | null;
  dateOfBirth?: Date | null;
  phone?: string | null;
  profileImage?: string | null;
  promotionalVideo?: string[] | null;
  isOnline?: boolean;
  isBanned?: boolean;
  isEmailVerified?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  blockedUsers?: string[];
  otp?: string | null;
  otpExpires?: Date | null;
};

export type RequestWithUser = Request & { user: typeOfUserObject };

export function assertHasUser(req: Request): asserts req is RequestWithUser {
  if (!('user' in req)) {
    throw new APIError(
      'User not found',
      'JWT Error',
      STATUS_CODES.UNAUTHORISED,
    );
  }
}

export const verifyJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(STATUS_CODES.UNAUTHORISED).send({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, env.jwt_secret as string, (err, user) => {
    if (err) {
      res.status(STATUS_CODES.UNAUTHORISED).send({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const userObj = user as typeOfUserObject;
    (req as RequestWithUser).user = userObj;

    next();
  });
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestWithUser = req as RequestWithUser;

  assertHasUser(requestWithUser);

  if (requestWithUser.user.userRole !== 'ADMIN') {
    throw new APIError('Access denied: Admins only', 'Authorization Error', STATUS_CODES.UNAUTHORISED);
  }

  next();
};
