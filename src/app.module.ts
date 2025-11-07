import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { QueueInterceptor } from './common/interceptors/queue.interceptor';
import { QueueModule } from './common/queue.module';

import { Usuario } from './entities/usuario.entity';
import { Paquete } from './paquetes/entidades/paquete.entity';
import { Itinerario } from './entities/itinerario.entity';
import { Hotel } from './entities/hotel.entity';
import { Destino } from './entities/destino.entity';
import { Imagen } from './entities/imagen.entity';
import { Mayoristas } from './entities/mayoristas.entity';
import { Contacto } from './entities/contacto.entity';
import { QueueTaskHistory } from './entities/queue-task-history.entity';

import { PaquetesModule } from './paquetes/paquetes.module';
import { MayoristasModule } from './mayoristas/mayoristas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CleanupModule } from './common/cleanup.module';
import { AdminModule } from './admin/admin.module';
import { ContactoModule } from './contacto/contacto.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutos por defecto
      max: 1000, // máximo 1000 items en caché
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60s ventana
        limit: 60, // 60 req/min por IP
      },
      {
        ttl: 10_000, // 10s ventana corta
        limit: 20, // ráfagas cortas
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        
        // ⚠️ PRODUCCIÓN: synchronize debe ser false y usar migraciones
        const synchronize = configService.get<string>('DB_SYNCHRONIZE') === 'true';
        const logging = configService.get<string>('DB_LOGGING') === 'true';
        const sslEnabled = configService.get<string>('DB_SSL') === 'true';

        const type = configService.get<string>('DB_TYPE') as any;
        if (!type) {
          throw new Error('❌ DB_TYPE no está configurado en variables de entorno');
        }

        // Helper para enmascarar password
        const mask = (val?: string | null) => {
          if (!val) return undefined;
          if (val.length <= 4) return '****';
          return `${val.substring(0, 2)}***${val.substring(val.length - 2)}`;
        };

        const rawDbEnvLog = {
          NODE_ENV: configService.get<string>('NODE_ENV'),
          DB_TYPE: configService.get<string>('DB_TYPE'),
            DB_HOST: configService.get<string>('DB_HOST'),
          DB_PORT: configService.get<string>('DB_PORT'),
          DB_USERNAME: configService.get<string>('DB_USERNAME'),
          DB_PASSWORD: mask(configService.get<string>('DB_PASSWORD')),
          DB_DATABASE: configService.get<string>('DB_DATABASE'),
          DB_SSL: configService.get<string>('DB_SSL'),
          DB_LOGGING: configService.get<string>('DB_LOGGING'),
          DB_SYNCHRONIZE: configService.get<string>('DB_SYNCHRONIZE'),
        };

        console.log('🧪 Variables de entorno (DB) detectadas:', rawDbEnvLog);

        // ⚠️ Advertencia si synchronize está activo en producción
        if (isProd && synchronize) {
          console.warn('⚠️  PELIGRO: DB_SYNCHRONIZE=true en PRODUCCIÓN. Esto puede causar pérdida de datos.');
          console.warn('⚠️  Recomendación: Usar DB_SYNCHRONIZE=false y migraciones en producción.');
        }

        // Validar variables de entorno críticas
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<string>('DB_PORT');
        const dbUsername = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbDatabase = configService.get<string>('DB_DATABASE');

        if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbDatabase) {
          throw new Error('❌ Variables de entorno de base de datos incompletas. Verifica DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
        }

        const baseConfig: TypeOrmModuleOptions = {
          type,
          host: dbHost,
          port: parseInt(dbPort, 10),
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [
            Usuario,
            Paquete,
            Itinerario,
            Hotel,
            Destino,
            Imagen,
            Mayoristas,
            Contacto,
            QueueTaskHistory,
          ],
          synchronize,
          logging,
          ssl: sslEnabled
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
          extra: sslEnabled
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : undefined,
        };

        console.log('🔌 DB Config:', {
          type: baseConfig.type,
          host: baseConfig.host,
          port: baseConfig.port,
          database: baseConfig.database,
          username: baseConfig.username,
          synchronize: baseConfig.synchronize,
          logging: baseConfig.logging,
          ssl: !!sslEnabled,
          NODE_ENV: process.env.NODE_ENV,
        });

        return baseConfig;
      },
    }),
    PaquetesModule,
    MayoristasModule,
    UsuariosModule,
    CloudinaryModule,
    CleanupModule,
    AdminModule,
    ContactoModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: QueueInterceptor },
  ],
})
export class AppModule {}
