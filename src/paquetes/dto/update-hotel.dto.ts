import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateImagenDto } from './update-imagen.dto';

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateImagenDto)
  readonly imagenes?: UpdateImagenDto[];
}