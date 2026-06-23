import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelinesService } from '../pipelines/pipelines.service';
import { Queue } from 'bullmq';
import { PIPELINE_QUEUE } from '../queue/queue.module';

@Injectable()
export class RunsService {
  constructor(
    private prisma: PrismaService,
    private pipelinesService: PipelinesService,
    @Inject(PIPELINE_QUEUE) private pipelineQueue: Queue,
  ) {}

  async trigger(userId: string, pipelineId: string) {
    const pipeline = await this.pipelinesService.findOne(userId, pipelineId);

    const run = await this.prisma.pipelineRun.create({
      data: {
        pipelineId,
        status: 'PENDING',
      },
    });

    // push to Redis queue — worker will pick this up
    await this.pipelineQueue.add('execute-pipeline', {
      runId: run.id,
      pipelineId: pipeline.id,
      yamlConfig: pipeline.yamlConfig,
    });

    return run;
  }

  async findAllForPipeline(userId: string, pipelineId: string) {
    await this.pipelinesService.findOne(userId, pipelineId);

    return this.prisma.pipelineRun.findMany({
      where: { pipelineId },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  async findOne(userId: string, runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: {
        pipeline: {
          include: { project: true },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    if (run.pipeline.project.ownerId !== userId) {
      throw new ForbiddenException('You do not own this run');
    }

    return run;
  }
}