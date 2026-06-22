import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class PipelinesController {
  constructor(private pipelinesService: PipelinesService) {}

  @Post('projects/:projectId/pipelines')
  create(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreatePipelineDto,
  ) {
    return this.pipelinesService.create(req.user.userId, projectId, dto);
  }

  @Get('projects/:projectId/pipelines')
  findAllForProject(@Request() req: any, @Param('projectId') projectId: string) {
    return this.pipelinesService.findAllForProject(req.user.userId, projectId);
  }

  @Get('pipelines/:id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.pipelinesService.findOne(req.user.userId, id);
  }
}