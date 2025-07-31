import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsPositive,
  ValidateNested,
  IsArray,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDestinoDto } from './create-destino.dto';
import { CreateImagenDto } from './create-imagen.dto';
import { CreateHotelDto } from './create-hotel.dto';

export class CreatePaqueteDto {
  @IsString()
  @IsNotEmpty()
  readonly titulo: string;

  @IsString()
  @IsNotEmpty()
  readonly origen: string;

  @IsNumber()
  readonly origen_lat: number;

  @IsNumber()
  readonly origen_lng: number;

  @IsDateString()
  readonly fecha_inicio: Date;

  @IsDateString()
  readonly fecha_fin: Date;

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

  @IsNumber()
  @IsPositive()
  readonly precio_total: number;

  @IsOptional()
  @ValidateIf((o) => o.notas !== null)
  @IsString()
  readonly notas?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly activo?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinoDto)
  readonly destinos?: CreateDestinoDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateImagenDto)
  readonly imagenes?: CreateImagenDto[];

  @IsOptional()
  @ValidateIf((o) => o.hotel !== null)
  @ValidateNested()
  @Type(() => CreateHotelDto)
  readonly hotel?: CreateHotelDto | null;

  @IsOptional()
  @IsString()
  readonly itinerario_texto?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly mayoristasIds?: string[];
}
