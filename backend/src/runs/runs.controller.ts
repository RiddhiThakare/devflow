import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RunsService } from './runs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class RunsController {
  constructor(private runsService: RunsService) {}

  @UseGuards(RateLimitGuard)
  @Post('pipelines/:pipelineId/trigger')
  trigger(@Request() req: any, @Param('pipelineId') pipelineId: string) {
    return this.runsService.trigger(req.user.userId, pipelineId);
  }

  @Get('pipelines/:pipelineId/runs')
  findAllForPipeline(@Request() req: any, @Param('pipelineId') pipelineId: string) {
    return this.runsService.findAllForPipeline(req.user.userId, pipelineId);
  }

  @Get('runs/:id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.runsService.findOne(req.user.userId, id);
  }

  @Get('projects/:projectId/metrics')
  getMetrics(@Request() req: any, @Param('projectId') projectId: string) {
    return this.runsService.getMetrics(req.user.userId, projectId);
  }
}