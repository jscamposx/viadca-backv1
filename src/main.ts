import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { ValidationPipe } from '@nestjs/common'; // ¡Importa ValidationPipe!

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita el ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no permitidas
      transform: true, // Transforma el payload a una instancia del DTO
    }),
  );

  app.use(compression());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();