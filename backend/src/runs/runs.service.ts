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

async getMetrics(userId: string, projectId: string) {
  // verify ownership first
  await this.pipelinesService['projectsService'] // indirect check
  // simpler: just verify via a direct project ownership check
  // we'll do it by fetching all pipelines for the project
  const pipelines = await this.prisma.pipeline.findMany({
    where: { projectId },
    include: { project: true },
  });

  if (pipelines.length === 0) {
    return {
      totalRuns: 0,
      successRate: 0,
      avgBuildTimeSeconds: 0,
      dailyRuns: [],
    };
  }

  // verify ownership via first pipeline's project
  if (pipelines[0].project.ownerId !== userId) {
    throw new ForbiddenException('You do not own this project');
  }

  const pipelineIds = pipelines.map((p) => p.id);

  const runs = await this.prisma.pipelineRun.findMany({
    where: { pipelineId: { in: pipelineIds } },
    orderBy: { triggeredAt: 'desc' },
  });

  const totalRuns = runs.length;

  const successfulRuns = runs.filter((r) => r.status === 'SUCCESS');
  const successRate =
    totalRuns > 0 ? Math.round((successfulRuns.length / totalRuns) * 100) : 0;

  const completedRuns = runs.filter((r) => r.triggeredAt && r.finishedAt);
  const avgBuildTimeSeconds =
    completedRuns.length > 0
      ? Math.round(
          completedRuns.reduce((sum, r) => {
            const diff =
              new Date(r.finishedAt!).getTime() -
              new Date(r.triggeredAt).getTime();
            return sum + diff / 1000;
          }, 0) / completedRuns.length
        )
      : 0;

  // daily runs for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyRuns = last7Days.map((date) => ({
    date,
    count: runs.filter(
      (r) => r.triggeredAt.toISOString().split('T')[0] === date
    ).length,
  }));

  return {
    totalRuns,
    successRate,
    avgBuildTimeSeconds,
    dailyRuns,
  };
}
}