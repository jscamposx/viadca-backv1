// src/main.ts

import { NestFactory, Reflector } from '@nestjs/core'; // Reflector es nuevo
import { AppModule } from './app.module';
import * as compression from 'compression';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common'; // ClassSerializerInterceptor es nuevo

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita el ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // AÑADE ESTA LÍNEA PARA EL INTERCEPTOR
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(compression());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();