import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateImagenDto } from './create-imagen.dto';

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty()
  readonly placeId: string;

  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsNumber()
  readonly estrellas: number;

  @IsBoolean()
  readonly isCustom: boolean;

  @IsNumber()
  readonly total_calificaciones: number;

  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateImagenDto)
  readonly imagenes?: CreateImagenDto[];
}