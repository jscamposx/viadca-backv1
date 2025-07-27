import { IsString, IsNumber, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateImagenDto } from './create-imagen.dto';
import { UpdateImagenDto } from './update-imagen.dto'; // Asumiendo que exista o se cree un DTO para actualizar imagenes

export class UpdateHotelDto {
  @IsOptional()
  @IsString()
  readonly placeId?: string;

  @IsOptional()
  @IsString()
  readonly nombre?: string;

  @IsOptional()
  @IsNumber()
  readonly estrellas?: number;

  @IsOptional()
  @IsBoolean()
  readonly isCustom?: boolean;

  @IsOptional()
  @IsNumber()
  readonly total_calificaciones?: number;

  @IsOptional()
  @IsString()
  readonly descripcion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateImagenDto) // Se usaría un UpdateImagenDto para la actualización
  readonly imagenes?: UpdateImagenDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateHotelDto) // <-- Añade la validación para los hoteles
  readonly hoteles?: UpdateHotelDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  readonly mayoristasIds?: number[];
}