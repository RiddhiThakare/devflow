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
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://devflow-gamma-sable.vercel.app',
    ];

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const logsGateway = app.get(LogsGateway);
  setLogsGateway(logsGateway);

  startPipelineWorker();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();