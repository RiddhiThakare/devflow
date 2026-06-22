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

@UseGuards(JwtAuthGuard)
@Controller()
export class RunsController {
  constructor(private runsService: RunsService) {}

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
}