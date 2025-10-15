import { Entity, Column, Index } from 'typeorm';
import { SoftDeleteEntity } from './base/soft-delete.entity';

export enum TaskStatus {
  ENQUEUED = 'enqueued',
  STARTED = 'started',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

@Entity('queue_task_history')
@Index(['status', 'creadoEn'])
@Index(['usuarioId', 'creadoEn'])
@Index(['endpoint', 'creadoEn'])
export class QueueTaskHistory extends SoftDeleteEntity {
  @Column({ type: 'int' })
  taskId: number;

  @Column({ type: 'enum', enum: TaskStatus })
  status: TaskStatus;

  // Información del usuario
  @Column({ type: 'int', nullable: true })
  usuarioId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  usuarioNombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  usuarioRol: string;

  // Información de la petición
  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  // Métricas de tiempo
  @Column({ type: 'timestamp' })
  enqueuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  waitTimeMs: number; // Tiempo en cola antes de ejecutarse

  @Column({ type: 'int', nullable: true })
  executionTimeMs: number; // Tiempo de ejecución

  @Column({ type: 'int', nullable: true })
  totalTimeMs: number; // Tiempo total (espera + ejecución)

  // Información adicional
  @Column({ type: 'int', nullable: true })
  queueLengthAtEnqueue: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  errorStack: string;

  @Column({ type: 'json', nullable: true })
  metadata: any; // Información adicional flexible
}
