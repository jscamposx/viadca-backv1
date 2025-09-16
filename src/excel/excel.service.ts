import { Injectable } from '@nestjs/common';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { PaqueteExcelTemplate } from './templates/paquete-excel.template';
import { ExcelDataFormatterService } from './services/excel-data-formatter.service';

@Injectable()
export class ExcelService {
  constructor(private readonly dataFormatter: ExcelDataFormatterService) {}

  async generatePaqueteExcel(
    paquete: Paquete,
    clienteName?: string,
  ): Promise<Buffer> {
    const formattedData = this.dataFormatter.formatPaqueteData(paquete);

    const result = await PaqueteExcelTemplate.createTemplate(
      paquete,
      formattedData,
      clienteName,
    );

    if ('error' in result) {
      throw new Error(
        `Error generando Excel: ${result.error}. Detalles: ${result.errors.join(', ')}`,
      );
    }

    return result.buffer;
  }
}
