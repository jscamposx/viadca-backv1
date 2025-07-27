import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class UpdateImagenDto {
  @IsOptional()
  @IsNumber()
  hotel_id?: number;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['base64', 'url'])
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
}
