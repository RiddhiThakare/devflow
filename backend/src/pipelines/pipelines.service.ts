import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
  ) {}

  async create(userId: string, projectId: string, dto: CreatePipelineDto) {
    // reuses ownership check from ProjectsService
    await this.projectsService.findOne(userId, projectId);

    return this.prisma.pipeline.create({
      data: {
        name: dto.name,
        yamlConfig: dto.yamlConfig,
        projectId,
      },
    });
  }

  async findAllForProject(userId: string, projectId: string) {
    await this.projectsService.findOne(userId, projectId);

    return this.prisma.pipeline.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: { project: true },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (pipeline.project.ownerId !== userId) {
      throw new ForbiddenException('You do not own this pipeline');
    }

    return pipeline;
  }
}