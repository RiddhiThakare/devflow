import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { startPipelineWorker } from './queue/pipeline.worker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  startPipelineWorker();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();