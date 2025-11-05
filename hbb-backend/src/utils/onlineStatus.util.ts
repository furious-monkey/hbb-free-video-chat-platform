// utils/onlineStatus.util.ts - Utility function for handling online status
import { getRedisClient } from '../config/redis';

export async function isUserOnline(userId: string): Promise<boolean> {
  const redisClient = getRedisClient();
  return (await redisClient.exists(`user:online:${userId}`)) === 1;
}
