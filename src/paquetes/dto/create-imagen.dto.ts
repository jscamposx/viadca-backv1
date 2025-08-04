import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class CreateImagenDto {
  @IsOptional()
  @IsUUID('4')
  hotel_id?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsString()
  @IsEnum(['url', 'google_places_url', 'cloudinary'])
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

  @IsOptional()
  @IsString()
  cloudinary_public_id?: string;

  @IsOptional()
  @IsString()
  cloudinary_url?: string;
}
