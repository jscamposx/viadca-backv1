import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ContactoController } from './contacto.controller';
import { ContactoService } from './contacto.service';
import { Contacto } from '../entities/contacto.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contacto]),
    CacheModule.register({ ttl: 300, max: 100 }),
    UsuariosModule,
  ],
  controllers: [ContactoController],
  providers: [ContactoService],
  exports: [ContactoService],
})
export class ContactoModule {}
