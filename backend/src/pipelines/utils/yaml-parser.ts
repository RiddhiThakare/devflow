import { parse } from 'yaml';
import { PipelineConfig } from '../interfaces/pipeline-config.interface';
import { BadRequestException } from '@nestjs/common';

export function parsePipelineYaml(yamlString: string): PipelineConfig {
  let parsed: any;

  try {
    parsed = parse(yamlString);
  } catch (err) {
    throw new BadRequestException('Invalid YAML syntax');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new BadRequestException('Pipeline config must be an object');
  }

  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new BadRequestException('Pipeline config must have a "name" string');
  }

  if (!parsed.repo || typeof parsed.repo !== 'string') {
    throw new BadRequestException('Pipeline config must have a "repo" URL string');
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new BadRequestException('Pipeline config must have a non-empty "steps" array');
  }

  for (const step of parsed.steps) {
    if (!step.name || typeof step.name !== 'string') {
      throw new BadRequestException('Each step must have a "name" string');
    }
    if (!step.run || typeof step.run !== 'string') {
      throw new BadRequestException('Each step must have a "run" string');
    }
  }

  return parsed as PipelineConfig;
}