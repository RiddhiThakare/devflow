import { Test, TestingModule } from '@nestjs/testing';
import { LogsGateway } from './logs.gateway';

describe('LogsGateway', () => {
  let gateway: LogsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogsGateway],
    }).compile();

    gateway = module.get<LogsGateway>(LogsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
