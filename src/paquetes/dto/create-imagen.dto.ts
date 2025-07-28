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
