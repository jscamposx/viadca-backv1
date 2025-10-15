import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { QueueTaskHistory, TaskStatus } from '../../entities/queue-task-history.entity';

export interface TaskMetadata {
  userId?: number;
  userName?: string;
  userRole?: string;
  method?: string;
  endpoint?: string;
  ip?: string;
  userAgent?: string;
}

interface QueueTask<T = any> {
  id: number;
  handler: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
  metadata?: TaskMetadata;
}

type QueueEventType = 'enqueued' | 'started' | 'completed' | 'rejected';

interface QueueEvent {
  taskId: number;
  type: QueueEventType;
  timestamp: number;
  waitMs?: number;
}

@Injectable()
export class RequestQueueService {
  private readonly logger = new Logger(RequestQueueService.name);
  private queue: QueueTask[] = [];
  private processing = 0;
  private taskIdSeq = 0;

  private readonly maxConcurrency = 3; // número máximo de tareas concurrentes simultáneas
  private readonly maxQueueSize = 200; // tamaño máximo antes de rechazar
  private metrics = {
    processed: 0,
    rejected: 0,
    avgWaitMs: 0,
  };
  private dailyStats = new Map<string, { processed: number; rejected: number }>();
  private history: QueueEvent[] = [];
  private readonly historyLimit = 50;

  constructor(
    @InjectRepository(QueueTaskHistory)
    private readonly taskHistoryRepo: Repository<QueueTaskHistory>,
  ) {}

  async enqueue<T>(handler: () => Promise<T>, metadata?: TaskMetadata): Promise<T> {
    if (this.queue.length >= this.maxQueueSize) {
      this.metrics.rejected++;
      this.bumpDailyRejected();
      throw new Error('Sistema ocupado. Intente nuevamente más tarde.');
    }

    return new Promise<T>((resolve, reject) => {
      const task: QueueTask<T> = {
        id: ++this.taskIdSeq,
        handler,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        metadata,
      };
      this.queue.push(task);
      this.logger.debug(`Enqueued task ${task.id}. Queue length=${this.queue.length}`);
      this.pushEvent({ taskId: task.id, type: 'enqueued', timestamp: task.enqueuedAt });
      
      // Crear registro inicial en BD
      this.createTaskHistoryRecord(task).catch(err => {
        this.logger.error(`Error creating task history: ${err.message}`);
      });
      
      this.dispatch();
    });
  }

  private dispatch() {
    while (this.processing < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;
      this.processing++;
      const now = Date.now();
      const waitTime = Date.now() - task.enqueuedAt;
      // actualizar promedio de espera simple
      this.metrics.avgWaitMs =
        (this.metrics.avgWaitMs * this.metrics.processed + waitTime) /
        (this.metrics.processed + 1);

      this.pushEvent({ taskId: task.id, type: 'started', timestamp: now, waitMs: waitTime });

      // Actualizar registro en BD - tarea iniciada
      this.updateTaskHistoryStarted(task.id, waitTime).catch(err => {
        this.logger.error(`Error updating task history (started): ${err.message}`);
      });

      const executionStartTime = Date.now();

      task
        .handler()
        .then((result) => {
          task.resolve(result);
          this.metrics.processed++;
          this.bumpDailyProcessed();
          const completedAt = Date.now();
          const executionTime = completedAt - executionStartTime;
          this.pushEvent({ taskId: task.id, type: 'completed', timestamp: completedAt });
          
          // Actualizar registro en BD - tarea completada
          this.updateTaskHistoryCompleted(task.id, executionTime).catch(err => {
            this.logger.error(`Error updating task history (completed): ${err.message}`);
          });
        })
        .catch((err) => {
          task.reject(err);
          this.metrics.rejected++;
          this.bumpDailyRejected();
          const failedAt = Date.now();
          const executionTime = failedAt - executionStartTime;
          this.pushEvent({ taskId: task.id, type: 'rejected', timestamp: failedAt });
          
          // Actualizar registro en BD - tarea fallida
          this.updateTaskHistoryFailed(task.id, executionTime, err).catch(updateErr => {
            this.logger.error(`Error updating task history (failed): ${updateErr.message}`);
          });
        })
        .finally(() => {
          this.processing--;
          this.dispatch();
        });
    }
  }

  private pushEvent(event: QueueEvent) {
    this.history.push(event);
    if (this.history.length > this.historyLimit) {
      this.history.splice(0, this.history.length - this.historyLimit);
    }
  }

  private bumpDailyProcessed() {
    const today = new Date().toISOString().slice(0, 10);
    const stat = this.dailyStats.get(today) ?? { processed: 0, rejected: 0 };
    stat.processed += 1;
    this.dailyStats.set(today, stat);
    this.pruneDailyStats();
  }

  private bumpDailyRejected() {
    const today = new Date().toISOString().slice(0, 10);
    const stat = this.dailyStats.get(today) ?? { processed: 0, rejected: 0 };
    stat.rejected += 1;
    this.dailyStats.set(today, stat);
    this.pruneDailyStats();
  }

  private pruneDailyStats() {
    const entries = Array.from(this.dailyStats.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
    if (entries.length <= 7) return;
    const trimmed = entries.slice(0, 7);
    this.dailyStats.clear();
    for (const [date, stat] of trimmed) {
      this.dailyStats.set(date, stat);
    }
  }

  // Métodos para registro en base de datos
  private async createTaskHistoryRecord(task: QueueTask): Promise<void> {
    try {
      const record = this.taskHistoryRepo.create({
        taskId: task.id,
        status: TaskStatus.ENQUEUED,
        usuarioId: task.metadata?.userId,
        usuarioNombre: task.metadata?.userName,
        usuarioRol: task.metadata?.userRole,
        method: task.metadata?.method || 'UNKNOWN',
        endpoint: task.metadata?.endpoint || 'UNKNOWN',
        ip: task.metadata?.ip,
        userAgent: task.metadata?.userAgent,
        enqueuedAt: new Date(task.enqueuedAt),
        queueLengthAtEnqueue: this.queue.length,
      });
      await this.taskHistoryRepo.save(record);
    } catch (error) {
      this.logger.error(`Error saving task history: ${error.message}`);
    }
  }

  private async updateTaskHistoryStarted(taskId: number, waitTimeMs: number): Promise<void> {
    try {
      await this.taskHistoryRepo.update(
        { taskId },
        {
          status: TaskStatus.STARTED,
          startedAt: new Date(),
          waitTimeMs,
        },
      );
    } catch (error) {
      this.logger.error(`Error updating task history (started): ${error.message}`);
    }
  }

  private async updateTaskHistoryCompleted(taskId: number, executionTimeMs: number): Promise<void> {
    try {
      const record = await this.taskHistoryRepo.findOne({ where: { taskId } });
      if (!record) return;

      const completedAt = new Date();
      const totalTimeMs = completedAt.getTime() - record.enqueuedAt.getTime();

      await this.taskHistoryRepo.update(
        { taskId },
        {
          status: TaskStatus.COMPLETED,
          completedAt,
          executionTimeMs,
          totalTimeMs,
        },
      );
    } catch (error) {
      this.logger.error(`Error updating task history (completed): ${error.message}`);
    }
  }

  private async updateTaskHistoryFailed(taskId: number, executionTimeMs: number, error: any): Promise<void> {
    try {
      const record = await this.taskHistoryRepo.findOne({ where: { taskId } });
      if (!record) return;

      const failedAt = new Date();
      const totalTimeMs = failedAt.getTime() - record.enqueuedAt.getTime();

      await this.taskHistoryRepo.update(
        { taskId },
        {
          status: TaskStatus.FAILED,
          completedAt: failedAt,
          executionTimeMs,
          totalTimeMs,
          errorMessage: error?.message || 'Unknown error',
          errorStack: error?.stack || null,
        },
      );
    } catch (updateError) {
      this.logger.error(`Error updating task history (failed): ${updateError.message}`);
    }
  }

  // Métodos para consultar historial
  async getTaskHistory(filters: {
    status?: TaskStatus;
    usuarioId?: number;
    startDate?: Date;
    endDate?: Date;
    endpoint?: string;
    method?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: QueueTaskHistory[]; total: number }> {
    const { limit = 50, offset = 0, ...otherFilters } = filters;

    const where: FindOptionsWhere<QueueTaskHistory> = {};

    if (otherFilters.status) {
      where.status = otherFilters.status;
    }

    if (otherFilters.usuarioId) {
      where.usuarioId = otherFilters.usuarioId;
    }

    if (otherFilters.endpoint) {
      where.endpoint = otherFilters.endpoint;
    }

    if (otherFilters.method) {
      where.method = otherFilters.method;
    }

    if (otherFilters.startDate || otherFilters.endDate) {
      const start = otherFilters.startDate || new Date(0);
      const end = otherFilters.endDate || new Date();
      where.creadoEn = Between(start, end) as any;
    }

    const [tasks, total] = await this.taskHistoryRepo.findAndCount({
      where,
      order: { creadoEn: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { tasks, total };
  }

  async getTaskStats(filters: {
    startDate?: Date;
    endDate?: Date;
    usuarioId?: number;
  }): Promise<any> {
    const where: FindOptionsWhere<QueueTaskHistory> = {};

    if (filters.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters.startDate || filters.endDate) {
      const start = filters.startDate || new Date(0);
      const end = filters.endDate || new Date();
      where.creadoEn = Between(start, end) as any;
    }

    const tasks = await this.taskHistoryRepo.find({ where });

    const stats = {
      total: tasks.length,
      byStatus: {
        enqueued: tasks.filter(t => t.status === TaskStatus.ENQUEUED).length,
        started: tasks.filter(t => t.status === TaskStatus.STARTED).length,
        completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
        failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
        rejected: tasks.filter(t => t.status === TaskStatus.REJECTED).length,
      },
      avgWaitTimeMs: this.calculateAverage(tasks, 'waitTimeMs'),
      avgExecutionTimeMs: this.calculateAverage(tasks, 'executionTimeMs'),
      avgTotalTimeMs: this.calculateAverage(tasks, 'totalTimeMs'),
      topEndpoints: this.getTopItems(tasks, 'endpoint', 10),
      topUsers: this.getTopItems(tasks, 'usuarioNombre', 10),
      byMethod: this.groupByField(tasks, 'method'),
    };

    return stats;
  }

  private calculateAverage(tasks: QueueTaskHistory[], field: keyof QueueTaskHistory): number {
    const values = tasks.map(t => t[field]).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private getTopItems(tasks: QueueTaskHistory[], field: keyof QueueTaskHistory, limit: number): any[] {
    const counts = new Map<string, number>();
    tasks.forEach(task => {
      const value = task[field];
      if (value && typeof value === 'string') {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private groupByField(tasks: QueueTaskHistory[], field: keyof QueueTaskHistory): Record<string, number> {
    const groups: Record<string, number> = {};
    tasks.forEach(task => {
      const value = task[field];
      if (value && typeof value === 'string') {
        groups[value] = (groups[value] || 0) + 1;
      }
    });
    return groups;
  }

  getStatus() {
    const now = Date.now();
    const pendingSample = this.queue.slice(0, 5).map((task) => ({
      id: task.id,
      waitingMs: now - task.enqueuedAt,
    }));
    const estimatedWaitMs = Math.round(
      this.metrics.avgWaitMs * Math.max(this.queue.length - this.maxConcurrency + this.processing, 0),
    );

    const dailyTotals = Array.from(this.dailyStats.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, stat]) => ({ date, ...stat }));

    const history = this.history
      .slice()
      .reverse()
      .map((event) => ({
        taskId: event.taskId,
        type: event.type,
        timestamp: new Date(event.timestamp).toISOString(),
        waitMs: event.waitMs !== undefined ? Math.round(event.waitMs) : undefined,
      }));

    return {
      timestamp: new Date(now).toISOString(),
      queueLength: this.queue.length,
      processing: this.processing,
      maxConcurrency: this.maxConcurrency,
      metrics: {
        processed: this.metrics.processed,
        rejected: this.metrics.rejected,
        avgWaitMs: Math.round(this.metrics.avgWaitMs),
      },
      oldestWaitingMs: this.queue.length ? now - this.queue[0].enqueuedAt : 0,
      estimatedWaitMs,
      pendingSample,
      dailyTotals,
      recentEvents: history,
    };
  }
}
