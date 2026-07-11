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
    'https://https://devflow-gamma-sable.vercel.app',
    'https://devflow.vercel.app', // add this too in case Vercel gives you a cleaner URL
    'http://localhost:5173',
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