import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class CreateImagenDto {
  @IsOptional()
  @IsNumber()
  hotel_id?: number;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsString()
  @IsEnum(['base64', 'url'])
  tipo: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}
