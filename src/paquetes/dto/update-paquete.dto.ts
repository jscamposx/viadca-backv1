import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsPositive,
} from 'class-validator';

export class UpdatePaqueteDto {
  @IsOptional()
  @IsString()
  readonly titulo?: string;

  @IsOptional()
  @IsString()
  readonly slug?: string;

  @IsOptional()
  @IsDateString()
  readonly fecha_inicio?: Date;

  @IsOptional()
  @IsDateString()
  readonly fecha_fin?: Date;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly duracion_dias?: number;

  @IsOptional()
  @IsString()
  readonly incluye?: string;

  @IsOptional()
  @IsString()
  readonly no_incluye?: string;

  @IsOptional()
  @IsString()
  readonly requisitos?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly descuento?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly anticipo?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly precio_total?: number;

  @IsOptional()
  @IsString()
  readonly notas?: string;

  @IsOptional()
  @IsBoolean()
  readonly activo?: boolean;
}
