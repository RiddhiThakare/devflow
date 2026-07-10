import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

let rateLimiter: RateLimiterRedis;

function getRateLimiter(config: ConfigService): RateLimiterRedis {
  if (!rateLimiter) {
    const redisUrl = config.get<string>('REDIS_URL');

    let redisClient: Redis;

    if (redisUrl) {
      const url = new URL(redisUrl);
      redisClient = new Redis({
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
        enableOfflineQueue: false,
      });
    } else {
      redisClient = new Redis({
        host: config.get<string>('REDIS_HOST') || 'localhost',
        port: config.get<number>('REDIS_PORT') || 6379,
        enableOfflineQueue: false,
      });
    }

    rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'devflow_rl',
      points: 10,
      duration: 60,
    });
  }
  return rateLimiter;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.ip;

    try {
      await getRateLimiter(this.config).consume(userId);
      return true;
    } catch {
      throw new HttpException(
        {
          statusCode: 429,
          message: 'Too many requests — slow down.',
          retryAfter: '60 seconds',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}