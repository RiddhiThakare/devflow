import { Module, Global } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const PIPELINE_QUEUE = 'PIPELINE_QUEUE';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PIPELINE_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        
        // if REDIS_URL is provided (Railway), parse it
        if (redisUrl) {
          return new Queue('pipeline-execution', {
            connection: redisUrl,
          });
        }

        // fallback to host/port for local dev
        return new Queue('pipeline-execution', {
          connection: {
            host: config.get<string>('REDIS_HOST') || 'localhost',
            port: config.get<number>('REDIS_PORT') || 6379,
          },
        });
      },
    },
  ],
  exports: [PIPELINE_QUEUE],
})
export class QueueModule {}