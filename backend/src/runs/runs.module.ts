import { Module } from '@nestjs/common';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';
import { PipelinesModule } from '../pipelines/pipelines.module';

@Module({
  imports: [PipelinesModule],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}