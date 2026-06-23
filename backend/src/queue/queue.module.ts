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
        return new Queue('pipeline-execution', {
          connection: {
            host: config.get<string>('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT'),
          },
        });
      },
    },
  ],
  exports: [PIPELINE_QUEUE],
})
export class QueueModule {}