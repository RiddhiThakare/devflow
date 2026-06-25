import Docker from 'dockerode';

const docker = new Docker();

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

async function runContainer(
  image: string,
  cmd: string[],
  workspacePath: string,
): Promise<string> {
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

export async function cloneRepo(
  repoUrl: string,
  workspacePath: string,
): Promise<string> {
  // use a lightweight git image to clone into the mounted workspace
  return runContainer(
    'alpine/git',
    ['clone', repoUrl, '.'],
    workspacePath,
  );
}

export async function runStepInContainer(
  command: string,
  workspacePath: string,
): Promise<string> {
  return runContainer('node:18', ['sh', '-c', command], workspacePath);
}