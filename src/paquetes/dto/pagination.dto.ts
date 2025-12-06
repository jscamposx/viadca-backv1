import { IsOptional, IsPositive, Min, IsString, IsBoolean, IsIn } from 'class-validator';
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

  // Ordenamiento
  @IsOptional()
  @IsIn(['titulo', 'precio_total', 'fecha_inicio', 'activo', 'created_at'], {
    message: 'sortBy debe ser: titulo, precio_total, fecha_inicio, activo o created_at'
  })
  sortBy?: 'titulo' | 'precio_total' | 'fecha_inicio' | 'activo' | 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'], {
    message: 'sortOrder debe ser: ASC o DESC'
  })
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC';

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
