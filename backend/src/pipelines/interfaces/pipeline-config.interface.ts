export interface PipelineStep {
  name: string;
  run: string;
}

export interface PipelineConfig {
  name: string;
  steps: PipelineStep[];
}