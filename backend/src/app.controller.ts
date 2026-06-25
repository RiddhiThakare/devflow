import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LogsGateway } from './logs/logs.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logsGateway: LogsGateway,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return req.user;
  }

  @Get('test-emit')
  testEmit() {
    this.logsGateway.emitTestMessage('test-run-123', 'Hello from server!');
    return { sent: true };
  }
}