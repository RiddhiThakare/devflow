import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelinesService } from '../pipelines/pipelines.service';

@Injectable()
export class RunsService {
  constructor(
    private prisma: PrismaService,
    private pipelinesService: PipelinesService,
  ) {}

  async trigger(userId: string, pipelineId: string) {
    // confirms pipeline exists and user owns it (via its project)
    await this.pipelinesService.findOne(userId, pipelineId);

    return this.prisma.pipelineRun.create({
      data: {
        pipelineId,
        status: 'PENDING',
      },
    });
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