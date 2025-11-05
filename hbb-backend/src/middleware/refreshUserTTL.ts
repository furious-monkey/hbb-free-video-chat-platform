// middleware/refreshUserTTL.ts - Middleware for refreshing user TTL
import { NextFunction, Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { RequestWithUser } from './verifyJwt';

export const refreshUserTTL = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as RequestWithUser).user;

  if (user && user.id) {
    try {
      await getRedisClient().set(`user:online:${user.id}`, '1', { EX: 60 * 5 }); // refresh 5-min TTL
    } catch (err) {
      console.error('Redis TTL refresh failed:', err);
    }
  }

  next();
};
