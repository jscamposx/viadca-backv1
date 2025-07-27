import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHotelDto } from './create-hotel.dto';

export class UpdatePaqueteHotelesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHotelDto)
  readonly hoteles: CreateHotelDto[];
}
