import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class UpdateImagenDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsOptional()
  @IsUUID('4')
  hotel_id?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['url', 'google_places_url', 'cloudinary'])
  tipo?: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  cloudinary_public_id?: string;

  @IsOptional()
  @IsString()
  cloudinary_url?: string;
}
