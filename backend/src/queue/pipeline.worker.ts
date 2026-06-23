import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { parse } from 'yaml';

const prisma = new PrismaClient();

interface JobData {
  runId: string;
  pipelineId: string;
  yamlConfig: string;
}

async function processJob(job: Job<JobData>) {
  const { runId, yamlConfig } = job.data;

  console.log(`Processing run ${runId}`);

  // mark run as RUNNING
  await prisma.pipelineRun.update({
    where: { id: runId },
    data: { status: 'RUNNING' },
  });

  try {
    const config = parse(yamlConfig);
    let logs = '';

    for (const step of config.steps) {
      logs += `\n--- Running step: ${step.name} ---\n`;
      logs += `$ ${step.run}\n`;
      console.log(`Step: ${step.name} -> ${step.run}`);

      // simulate execution for now — real Docker execution comes in Step 11
      await new Promise((resolve) => setTimeout(resolve, 1000));
      logs += `Step completed.\n`;
    }

    await prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'SUCCESS',
        logs,
        finishedAt: new Date(),
      },
    });

    console.log(`Run ${runId} completed successfully`);
  } catch (err) {
    await prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        logs: `Error: ${err.message}`,
        finishedAt: new Date(),
      },
    });

    console.error(`Run ${runId} failed:`, err.message);
  }
}

export function startPipelineWorker() {
  const worker = new Worker<JobData>(
    'pipeline-execution',
    processJob,
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    },
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log('Pipeline worker started, listening for jobs...');

  return worker;
}