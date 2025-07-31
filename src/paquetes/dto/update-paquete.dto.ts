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
  ValidateIf,
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
  @IsString()
  readonly origen?: string;

  @IsOptional()
  @IsNumber()
  readonly origen_lat?: number;

  @IsOptional()
  @IsNumber()
  readonly origen_lng?: number;

  @IsOptional()
  @IsDateString()
  readonly fecha_inicio?: Date;

  @IsOptional()
  @IsDateString()
  readonly fecha_fin?: Date;

  @IsOptional()
  @ValidateIf((o) => o.incluye !== null)
  @IsString()
  readonly incluye?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.no_incluye !== null)
  @IsString()
  readonly no_incluye?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.requisitos !== null)
  @IsString()
  readonly requisitos?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly descuento?: number;

  @IsOptional()
  @ValidateIf((o) => o.anticipo !== null)
  @IsNumber()
  @IsPositive()
  readonly anticipo?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly precio_total?: number;

  @IsOptional()
  @ValidateIf((o) => o.notas !== null)
  @IsString()
  readonly notas?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly activo?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.hotel !== null)
  @ValidateNested()
  @Type(() => UpdateHotelDto)
  readonly hotel?: UpdateHotelDto | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly mayoristasIds?: string[];

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
