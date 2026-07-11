import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { startPipelineWorker, setLogsGateway } from './queue/pipeline.worker';
import { LogsGateway } from './logs/logs.gateway';
import { execSync } from 'child_process';

async function bootstrap() {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
  origin: [
    'devflow-5c80zvw5c-riddhithakare.vercel.app',
    'http://localhost:5173', // keep local dev working
  ],
  credentials: true,
});

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const logsGateway = app.get(LogsGateway);
  setLogsGateway(logsGateway);

  startPipelineWorker();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();