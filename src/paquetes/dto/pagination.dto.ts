import { IsOptional, IsPositive, Min, IsString, IsBoolean, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  limit?: number = 6;

  @IsOptional()
  @IsString()
  search?: string;

  // Si es true, ignora la paginación y devuelve todos los resultados
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  noPagination?: boolean;

  // Filtros específicos para paquetes
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  favorito?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['publico', 'privado', 'link-privado'])
  tipoAcceso?: 'publico' | 'privado' | 'link-privado';

  @IsOptional()
  @IsString()
  mayorista?: string; // Nombre o ID del mayorista

  @IsOptional()
  @IsString()
  moneda?: string; // USD, EUR, MXN, etc.
}

export class PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
