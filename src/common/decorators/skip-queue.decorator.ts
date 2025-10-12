import { SetMetadata } from '@nestjs/common';

export const SKIP_QUEUE_KEY = 'skipQueue';
export const SkipQueue = () => SetMetadata(SKIP_QUEUE_KEY, true);
