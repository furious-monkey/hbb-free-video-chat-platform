import { LogLevel, createLogger } from 'bunyan';
import env from './env';

const logger = createLogger({
  name: 'hbb-log',
  streams: [
    {
      stream: process.stdout,
      level: (env.log.level as LogLevel) || 'info',
    },
  ],
});

logger.info('hbb logger started');

export { logger };
