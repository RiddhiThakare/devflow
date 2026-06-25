import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const WORKSPACE_ROOT = path.join(os.tmpdir(), 'devflow-workspaces');

export function createWorkspace(runId: string): string {
  const workspacePath = path.join(WORKSPACE_ROOT, runId);
  fs.mkdirSync(workspacePath, { recursive: true });
  return workspacePath;
}

export function cleanupWorkspace(workspacePath: string): void {
  fs.rmSync(workspacePath, { recursive: true, force: true });
}