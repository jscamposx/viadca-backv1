import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('contacto')
export class Contacto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  num_telefono: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  num_whatsapp: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correo_electronico: string | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  horario: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  facebook: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tiktok: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  youtube: string | null;
}
