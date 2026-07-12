import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

function isDockerAvailable(): boolean {
  return fs.existsSync('/var/run/docker.sock');
}

function cleanLogOutput(buffer: Buffer): string {
  let result = '';
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const size = buffer.readUInt32BE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + size;
    if (chunkEnd > buffer.length) break;
    result += buffer.subarray(chunkStart, chunkEnd).toString('utf-8');
    offset = chunkEnd;
  }

  return result;
}

async function runInDocker(
  image: string,
  cmd: string[],
  workspacePath: string,
): Promise<string> {
  const docker = new Docker();

  const container = await docker.createContainer({
    Image: image,
    Cmd: cmd,
    Tty: false,
    WorkingDir: '/workspace',
    HostConfig: {
      AutoRemove: false,
      Binds: [`${workspacePath}:/workspace`],
    },
  });

  await container.start();
  await container.wait();

  const logBuffer = (await container.logs({
    stdout: true,
    stderr: true,
  })) as unknown as Buffer;

  const output = cleanLogOutput(logBuffer);
  await container.remove();

  return output.replace(/\u0000/g, '');
}

async function runDirectly(
  command: string,
  workspacePath: string,
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workspacePath,
      timeout: 60000, // 60 second timeout per step
    });
    return (stdout + stderr).replace(/\u0000/g, '');
  } catch (err: any) {
    // even if the command fails, return the output
    return ((err.stdout || '') + (err.stderr || '') + (err.message || '')).replace(/\u0000/g, '');
  }
}

export async function cloneRepo(
  repoUrl: string,
  workspacePath: string,
): Promise<string> {
  if (isDockerAvailable()) {
    return runInDocker('alpine/git', ['clone', repoUrl, '.'], workspacePath);
  }

  // fallback: run git directly on the host
  return runDirectly(`git clone ${repoUrl} .`, workspacePath);
}

export async function runStepInContainer(
  command: string,
  workspacePath: string,
): Promise<string> {
  if (isDockerAvailable()) {
    return runInDocker('node:18', ['sh', '-c', command], workspacePath);
  }

  // fallback: run command directly on the host
  return runDirectly(command, workspacePath);
}