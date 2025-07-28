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
