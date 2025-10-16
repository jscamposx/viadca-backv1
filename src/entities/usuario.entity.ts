import { Entity, Column, ManyToMany } from 'typeorm';
import { SoftDeleteEntity } from './base/soft-delete.entity';

export enum UsuarioRol {
  ADMIN = 'admin',
  PRE_AUTORIZADO = 'pre-autorizado',
  USUARIO = 'usuario',
}

@Entity('usuarios')
export class Usuario extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  usuario: string;

  @Column({ type: 'varchar', length: 255 })
  contrasena: string;

  @Column({
    type: 'enum',
    enum: UsuarioRol,
    default: UsuarioRol.PRE_AUTORIZADO,
  })
  rol: UsuarioRol;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 255, unique: true })
  correo: string;

  @Column({ type: 'text', nullable: true })
  token: string;

  @Column({ type: 'boolean', default: false })
  email_verificado: boolean;

  @Column({ type: 'text', nullable: true })
  token_verificacion: string | null;

  @Column({ type: 'text', nullable: true })
  token_recuperacion: string | null;

  @Column({ type: 'timestamp', nullable: true })
  token_recuperacion_expira: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre_completo: string;

  @ManyToMany(() => Paquete, (paquete) => paquete.usuariosAutorizados)
  paquetesPrivados: Paquete[];
}

// Import circular - se coloca al final del archivo
import { Paquete } from '../paquetes/entidades/paquete.entity';
