import { Type } from 'class-transformer';
import { IsArray, IsInt, IsPositive, Min, ValidateNested } from 'class-validator';

export class RespuestaItemDto {
  @IsInt()
  @IsPositive()
  preguntaId: number;

  @IsInt()
  @IsPositive()
  opcionId: number;

  @IsInt()
  @Min(0)
  tiempoRespuestaSeg: number;
}

export class FinalizeEvaluationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaItemDto)
  respuestas: RespuestaItemDto[];
}
