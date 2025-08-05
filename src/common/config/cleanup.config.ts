export interface CleanupConfig {
  retentionDays: number;

  cleanupHour: number;

  cleanupMinute: number;

  enableAutoHardDelete: boolean;

  enableAutoImageCleanup: boolean;

  enableDetailedLogs: boolean;
}

export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  retentionDays: 14, // 2 semanas
  cleanupHour: 2, // 2:00 AM
  cleanupMinute: 0,
  enableAutoHardDelete: true,
  enableAutoImageCleanup: true,
  enableDetailedLogs: false,
};

export function getCleanupConfig(): CleanupConfig {
  return {
    retentionDays: parseInt(process.env.CLEANUP_RETENTION_DAYS || '14', 10),
    cleanupHour: parseInt(process.env.CLEANUP_HOUR || '2', 10),
    cleanupMinute: parseInt(process.env.CLEANUP_MINUTE || '0', 10),
    enableAutoHardDelete: process.env.CLEANUP_AUTO_HARD_DELETE !== 'false',
    enableAutoImageCleanup: process.env.CLEANUP_AUTO_IMAGE_CLEANUP !== 'false',
    enableDetailedLogs: process.env.CLEANUP_DETAILED_LOGS === 'true',
  };
}
