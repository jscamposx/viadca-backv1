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
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDestinoDto } from './create-destino.dto';
import { CreateImagenDto } from './create-imagen.dto';
import { CreateHotelDto } from './create-hotel.dto';

export class CreatePaqueteDto {
  @IsString()
  @IsNotEmpty()
  readonly titulo: string;

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

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinoDto)
  readonly destinos?: CreateDestinoDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateImagenDto)
  readonly imagenes?: CreateImagenDto[];

 @IsOptional()
  @ValidateNested() // Ya no se necesita 'each: true' porque no es un array
  @Type(() => CreateHotelDto)
  readonly hotel?: CreateHotelDto; // Cambiado de 'hoteles' a 'hotel' y de array a objeto
  // --- FIN DE LA CORRECCIÓN ---

  @IsOptional()
  @IsString()
  readonly itinerario_texto?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  readonly mayoristasIds?: number[];
}