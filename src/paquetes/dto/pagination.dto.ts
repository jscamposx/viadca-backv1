import { IsOptional, IsPositive, Min, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 6;

  @IsOptional()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  noPagination?: boolean;

  // Filtros dinámicos permitidos explícitamente
  @IsOptional()
  activo?: any;

  @IsOptional()
  favorito?: any;

  @IsOptional()
  mayorista?: any;

  @IsOptional()
  tipoProducto?: any;

  @IsOptional()
  moneda?: any;

  @IsOptional()
  pais?: any;

  // Permite cualquier otro filtro dinámico
  [key: string]: any;
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
