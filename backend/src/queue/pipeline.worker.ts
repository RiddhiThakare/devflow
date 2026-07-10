import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { parse } from 'yaml';
import { cloneRepo, runStepInContainer } from './docker-executor';
import { createWorkspace, cleanupWorkspace } from './workspace-manager';
import { LogsGateway } from '../logs/logs.gateway';

const prisma = new PrismaClient();

interface JobData {
  runId: string;
  pipelineId: string;
  yamlConfig: string;
}

function sanitizeForPostgres(text: string): string {
  return text.replace(/\u0000/g, '');
}

let logsGateway: LogsGateway | null = null;

export function setLogsGateway(gateway: LogsGateway) {
  logsGateway = gateway;
}

function emitLog(runId: string, line: string) {
  if (logsGateway) {
    logsGateway.emitLogLine(runId, line);
  }
}

function emitStatus(runId: string, status: string) {
  if (logsGateway) {
    logsGateway.emitStatusUpdate(runId, status);
  }
}

async function processJob(job: Job<JobData>) {
  const { runId, yamlConfig } = job.data;

  console.log(`Processing run ${runId}`);

  await prisma.pipelineRun.update({
    where: { id: runId },
    data: { status: 'RUNNING' },
  });
  emitStatus(runId, 'RUNNING');

  let logs = '';
  let workspacePath: string | null = null;

  try {
    const config = parse(yamlConfig);
    workspacePath = createWorkspace(runId);

    const cloneHeader = `\n--- Cloning repository ---\n$ git clone ${config.repo}\n`;
    logs += cloneHeader;
    emitLog(runId, cloneHeader);

    const cloneOutput = await cloneRepo(config.repo, workspacePath);
    logs += cloneOutput;
    emitLog(runId, cloneOutput);

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: { logs: sanitizeForPostgres(logs) },
    });

    for (const step of config.steps) {
      const stepHeader = `\n--- Running step: ${step.name} ---\n$ ${step.run}\n`;
      logs += stepHeader;
      emitLog(runId, stepHeader);
      console.log(`Step: ${step.name} -> ${step.run}`);

      const output = await runStepInContainer(step.run, workspacePath);
      logs += output;
      emitLog(runId, output);

      await prisma.pipelineRun.update({
        where: { id: runId },
        data: { logs: sanitizeForPostgres(logs) },
      });
    }

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
      },
    });
    emitStatus(runId, 'SUCCESS');

    console.log(`Run ${runId} completed successfully`);
  } catch (err) {
    const errorLine = `\nError: ${err.message}\n`;
    logs += errorLine;
    emitLog(runId, errorLine);

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        logs: sanitizeForPostgres(logs),
        finishedAt: new Date(),
      },
    });
    emitStatus(runId, 'FAILED');

    console.error(`Run ${runId} failed:`, err.message);
  } finally {
    if (workspacePath) {
      cleanupWorkspace(workspacePath);
    }
  }
}

export function startPipelineWorker() {
  const redisUrl = process.env.REDIS_URL;

  let connection: { host: string; port: number; password?: string; tls?: object };

  if (redisUrl) {
    const url = new URL(redisUrl);
    connection = {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  } else {
    connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    };
  }

  const worker = new Worker<JobData>('pipeline-execution', processJob, {
    connection,
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log('Pipeline worker started, listening for jobs...');

  return worker;
}