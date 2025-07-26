import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression'; // Importa la librería

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita la compresión
  app.use(compression());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();