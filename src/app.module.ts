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
import { MayoristasModule } from './mayoristas/mayoristas.module'; // Importa el nuevo módulo

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig: TypeOrmModuleOptions = {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),

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

          synchronize: process.env.NODE_ENV === 'dev',
        };

        console.log('🔌 Usando configuración de base de datos:', {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          synchronize: dbConfig.synchronize,
        });

        return dbConfig;
      },
    }),
    PaquetesModule,
    MayoristasModule, // Añade el módulo aquí
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
