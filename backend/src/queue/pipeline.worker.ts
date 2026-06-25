import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { parse } from 'yaml';
import { cloneRepo, runStepInContainer } from './docker-executor';
import { createWorkspace, cleanupWorkspace } from './workspace-manager';

const prisma = new PrismaClient();

interface JobData {
  runId: string;
  pipelineId: string;
  yamlConfig: string;
}

function sanitizeForPostgres(text: string): string {
  return text.replace(/\u0000/g, '');
}

async function processJob(job: Job<JobData>) {
  const { runId, yamlConfig } = job.data;

  console.log(`Processing run ${runId}`);

  await prisma.pipelineRun.update({
    where: { id: runId },
    data: { status: 'RUNNING' },
  });

  let logs = '';
  let workspacePath: string | null = null;

  try {
    const config = parse(yamlConfig);

    workspacePath = createWorkspace(runId);

    // implicit first step — clone the repo
    logs += `\n--- Cloning repository ---\n$ git clone ${config.repo}\n`;
    const cloneOutput = await cloneRepo(config.repo, workspacePath);
    logs += cloneOutput;

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: { logs: sanitizeForPostgres(logs) },
    });

    // user-defined steps, now running inside the cloned workspace
    for (const step of config.steps) {
      logs += `\n--- Running step: ${step.name} ---\n`;
      logs += `$ ${step.run}\n`;
      console.log(`Step: ${step.name} -> ${step.run}`);

      const output = await runStepInContainer(step.run, workspacePath);
      logs += output;

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

    console.log(`Run ${runId} completed successfully`);
  } catch (err) {
    logs += `\nError: ${err.message}\n`;

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        logs: sanitizeForPostgres(logs),
        finishedAt: new Date(),
      },
    });

    console.error(`Run ${runId} failed:`, err.message);
  } finally {
    if (workspacePath) {
      cleanupWorkspace(workspacePath);
    }
  }
}

export function startPipelineWorker() {
  const worker = new Worker<JobData>('pipeline-execution', processJob, {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
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