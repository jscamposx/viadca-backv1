import { IsEmail, IsOptional, IsString, MaxLength, Matches, IsUrl } from 'class-validator';

export class ContactoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[0-9+\s()-]{0,100}$/, { message: 'Teléfono inválido' })
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[0-9+\s()-]{0,100}$/, { message: 'WhatsApp inválido' })
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  horario?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Facebook debe ser una URL válida' })
  @MaxLength(255)
  facebook?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Instagram debe ser una URL válida' })
  @MaxLength(255)
  instagram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'TikTok debe ser una URL válida' })
  @MaxLength(255)
  tiktok?: string;

  @IsOptional()
  @IsUrl({}, { message: 'YouTube debe ser una URL válida' })
  @MaxLength(255)
  youtube?: string;
}
