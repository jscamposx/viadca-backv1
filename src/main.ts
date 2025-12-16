import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { ValidationPipe, ClassSerializerInterceptor, BadRequestException } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  console.log('--------------------------------------------------');
  console.log('🚀 Iniciando aplicación...');
  console.log('📂 Directorio actual (CWD):', process.cwd());
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔌 PORT:', process.env.PORT);
  console.log('🔗 FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('--------------------------------------------------');

  const app = await NestFactory.create(AppModule);

  // 🔒 Seguridad: Helmet.js - Cabeceras HTTP seguras
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Permite embeds de Cloudinary
    }),
  );

  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));

  app.getHttpAdapter().getInstance().set('trust proxy', true);

  const isProd = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL;

  if (isProd && !frontendUrl) {
    throw new Error('❌ Variable de entorno FRONTEND_URL no configurada en producción');
  }

  app.enableCors({
    origin: isProd ? [frontendUrl as string] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    // allowedHeaders eliminado para que cors refleje Access-Control-Request-Headers automáticamente
  });

  app.use(cookieParser());

  // ValidationPipe global - Configuración permisiva para query params dinámicos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // NO remueve propiedades (para permitir todos los campos del DTO)
      forbidNonWhitelisted: false, // PERMITE propiedades no decoradas (necesario para filtros dinámicos en query params)
      transform: true, // Transforma los tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
        excludeExtraneousValues: false,
      },
      enableDebugMessages: false,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        console.error('❌ [GLOBAL VALIDATION] Errores:', JSON.stringify(errors, null, 2));
        return new BadRequestException({
          message: errors,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(compression());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => console.error(err));
