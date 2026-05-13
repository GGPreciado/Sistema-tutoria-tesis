import { IsInt, IsPositive } from 'class-validator';

export class CreateEvaluationDto {
  @IsInt()
  @IsPositive()
  temaId: number;
}
