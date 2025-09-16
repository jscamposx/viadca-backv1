import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { Usuario } from './entities/usuario.entity';
import { Paquete } from './paquetes/entidades/paquete.entity';
import { Itinerario } from './entities/itinerario.entity';
import { Hotel } from './entities/hotel.entity';
import { Destino } from './entities/destino.entity';
import { Imagen } from './entities/imagen.entity';
import { Mayoristas } from './entities/mayoristas.entity';
import { Contacto } from './entities/contacto.entity';

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
        const dbConfig: TypeOrmModuleOptions = {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),

          entities: [
            Usuario,
            Paquete,
            Itinerario,
            Hotel,
            Destino,
            Imagen,
            Mayoristas,
            Contacto,
          ],

          synchronize: true,
        };

        console.log('🔌 Usando configuración de base de datos:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          synchronize: dbConfig.synchronize,
          NODE_ENV: process.env.NODE_ENV,
        });

        return dbConfig;
      },
    }),
    PaquetesModule,
    MayoristasModule,
    UsuariosModule,
    CloudinaryModule,
    CleanupModule,
    AdminModule,
    ContactoModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
