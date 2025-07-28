import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsPositive,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateHotelDto } from './update-hotel.dto';
import { UpdateImagenDto } from './update-imagen.dto';
import { CreateDestinoDto } from './create-destino.dto';

export class UpdatePaqueteDto {
  @IsOptional()
  @IsString()
  readonly titulo?: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateHotelDto)
  readonly hotel?: UpdateHotelDto;

@IsOptional()
@IsArray()
@IsUUID('4', { each: true }) // <-- Cambia IsNumber por IsUUID
readonly mayoristasIds?: string[]; // <-- Cambia number[] por string[]
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateImagenDto)
  readonly imagenes?: UpdateImagenDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinoDto)
  readonly destinos?: CreateDestinoDto[];

  @IsOptional()
  @IsString()
  readonly itinerario_texto?: string;
}
