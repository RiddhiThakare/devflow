import { IsString, MinLength } from 'class-validator';

export class CreatePipelineDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(5)
  yamlConfig: string;
}