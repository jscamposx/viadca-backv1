import { Injectable, Logger } from '@nestjs/common';

interface QueueTask<T = any> {
  id: number;
  handler: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
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

  constructor() {}

  async enqueue<T>(handler: () => Promise<T>): Promise<T> {
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
      };
      this.queue.push(task);
      this.logger.debug(`Enqueued task ${task.id}. Queue length=${this.queue.length}`);
      this.pushEvent({ taskId: task.id, type: 'enqueued', timestamp: task.enqueuedAt });
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

      task
        .handler()
        .then((result) => {
          task.resolve(result);
          this.metrics.processed++;
          this.bumpDailyProcessed();
          this.pushEvent({ taskId: task.id, type: 'completed', timestamp: Date.now() });
        })
        .catch((err) => {
          task.reject(err);
          this.metrics.rejected++;
          this.bumpDailyRejected();
          this.pushEvent({ taskId: task.id, type: 'rejected', timestamp: Date.now() });
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
