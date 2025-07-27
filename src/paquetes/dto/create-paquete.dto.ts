import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsPositive,
} from 'class-validator';

export class CreatePaqueteDto {
  @IsString()
  @IsNotEmpty()
  readonly titulo: string;

  @IsString()
  @IsNotEmpty()
  readonly slug: string;

  @IsDateString()
  readonly fecha_inicio: Date;

  @IsDateString()
  readonly fecha_fin: Date;

  @IsNumber()
  @IsPositive()
  readonly duracion_dias: number;

  @IsString()
  @IsNotEmpty()
  readonly incluye: string;

  @IsString()
  @IsNotEmpty()
  readonly no_incluye: string;

  @IsString()
  @IsNotEmpty()
  readonly requisitos: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly descuento?: number;

  @IsNumber()
  @IsPositive()
  readonly anticipo: number;

  @IsNumber()
  @IsPositive()
  readonly precio_total: number;

  @IsOptional()
  @IsString()
  readonly notas?: string;

  @IsOptional()
  @IsBoolean()
  readonly activo?: boolean;
}