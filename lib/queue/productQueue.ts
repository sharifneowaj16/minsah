/**
 * productQueue.ts
 *
 * Manages async DB → Elasticsearch sync via BullMQ.
 * Job types:
 *   index  – create/update an ES document for one product
 *   delete – remove a product from the ES index
 *   reindex – full rebuild of the products index
 */

import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';

// ─── Redis connection ──────────────────────────────────────────────
function createBullRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn(
      '[productQueue] REDIS_URL not set – using redis://localhost:6379'
    );
    return new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null, // Required by BullMQ
      lazyConnect: true,
    });
  }
  return new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });
}

export const bullRedis: Redis = createBullRedis();

// ─── Job payload types ─────────────────────────────────────────────
export interface IndexJobData {
  type: 'index';
  productId: string;
}

export interface DeleteJobData {
  type: 'delete';
  productId: string;
}

export interface ReindexJobData {
  type: 'reindex';
  requestedAt: string; // ISO timestamp to distinguish jobs
}

export type ProductJobData = IndexJobData | DeleteJobData | ReindexJobData;

// ─── Queue singleton ───────────────────────────────────────────────
const globalForQueue = globalThis as unknown as {
  productQueue?: Queue<ProductJobData>;
};

function createQueue(): Queue<ProductJobData> {
  return new Queue('product-sync', {
    // BullMQ expects ConnectionOptions; cast ioredis instance to satisfy TS
    connection: bullRedis as unknown as ConnectionOptions,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000, // 1s → 2s → 4s → 8s …
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  }) as unknown as Queue<ProductJobData>;
}

export const productQueue: Queue<ProductJobData> =
  globalForQueue.productQueue ?? createQueue();

// Keep singleton in development to prevent duplicate queues on hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForQueue.productQueue = productQueue;
}

// ─── Optional: helper for lazy initialization ─────────────────────
export function getProductQueue(): Queue<ProductJobData> {
  return globalForQueue.productQueue ?? createQueue();
}
