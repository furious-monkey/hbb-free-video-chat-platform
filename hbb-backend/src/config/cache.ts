// config/cache.ts - Cache configuration for handling cache related functions
import { createClient } from 'redis';
import { logger } from './logger';
import env from './env';

export const redisClient = createClient(
  env.redis.url ? { url: env.redis.url } : {},
);

redisClient.on('error', (e) => {
  logger.error('redis client: ', e);
});

if (!redisClient.isOpen) {
  try {
    redisClient
      .connect()
      .then(() => {
        logger.info('redis connection established.');
      })
      .catch((error) => {
        logger.error('failed to connect to redis:', error);
      });
  } catch (error) {
    logger.error('failed to connect to redis:', error);
  }
}
