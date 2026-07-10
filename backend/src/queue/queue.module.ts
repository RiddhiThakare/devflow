import { Module, Global } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const PIPELINE_QUEUE = 'PIPELINE_QUEUE';

function parseRedisConnection(redisUrl?: string) {
  if (redisUrl) {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  }
  return null;
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PIPELINE_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const connection = parseRedisConnection(redisUrl) || {
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: config.get<number>('REDIS_PORT') || 6379,
        };

        return new Queue('pipeline-execution', { connection });
      },
    },
  ],
  exports: [PIPELINE_QUEUE],
})
export class QueueModule {}