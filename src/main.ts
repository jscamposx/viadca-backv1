import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));

  app.getHttpAdapter().getInstance().set('trust proxy', true);

  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProd ? [process.env.FRONTEND_URL as string] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    // allowedHeaders eliminado para que cors refleje Access-Control-Request-Headers automáticamente
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(compression());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => console.error(err));
