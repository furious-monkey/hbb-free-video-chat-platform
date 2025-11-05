import { config } from 'dotenv';
import { BaseError } from '../middleware/error/baseError';

// Only load the .env file in non-production environments (local development)
if (process.env.NODE_ENV !== 'production') {
  const env = config();
  if (env.error) {
    throw new BaseError(
      'Could not find .env file',
      env.error.message,
      '.env error',
    );
  }
}

export default {
  node_env: process.env.NODE_ENV || 'development', // Default to 'development' if not set
  port: process.env.PORT || 3000, // Default to 3000 if PORT is not set
  jwt_secret: process.env.JWT_SECRET || 'default-secret', // Default if not provided
  api: {
    prefix: '/api/v1',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379', // Default for local redis
  },
  log: {
    level: process.env.LOG_LEVEL || 'info', // Default log level
  },
};
