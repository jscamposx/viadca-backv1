import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelDataFormatterService } from './services/excel-data-formatter.service';

@Module({
  providers: [ExcelService, ExcelDataFormatterService],
  exports: [ExcelService],
})
export class ExcelModule {}
