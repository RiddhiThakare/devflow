import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { startPipelineWorker, setLogsGateway } from './queue/pipeline.worker';
import { LogsGateway } from './logs/logs.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // grab the Nest-managed gateway instance and hand it to the worker
  const logsGateway = app.get(LogsGateway);
  setLogsGateway(logsGateway);

  startPipelineWorker();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();