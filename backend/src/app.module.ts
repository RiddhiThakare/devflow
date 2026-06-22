import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    PipelinesModule,
    RunsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}