import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// --- Importa tus Entidades aquí ---
import { Usuario } from './entities/usuario.entity';
import { Paquete } from './paquetes/entidades/paquete.entity';
import { Itinerario } from './entities/itinerario.entity';
import { Hotel } from './entities/hotel.entity';
import { Destino } from './entities/destino.entity';
import { Imagen } from './entities/imagen.entity';
import { Mayorista } from './entities/mayorista.entity';
import { Contacto } from './entities/contacto.entity';

// --- Importa tus Módulos aquí ---
import { PaquetesModule } from './paquetes/paquetes.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Carga el archivo .env.dev si estás en desarrollo
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

          // --- Lista las entidades importadas aquí ---
          entities: [
            Usuario,
            Paquete,
            Itinerario,
            Hotel,
            Destino,
            Imagen,
            Mayorista,
            Contacto,
          ],

          // Sincroniza la base de datos solo en entorno de desarrollo
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
    PaquetesModule, // <-- Módulo añadido
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}