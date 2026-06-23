import { Module } from '@nestjs/common';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PipelinesModule, QueueModule],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}