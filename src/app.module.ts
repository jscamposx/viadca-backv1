import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
import { CloudinaryModule } from './cloudinary/cloudinary.module';

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
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
