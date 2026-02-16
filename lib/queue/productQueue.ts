/**
 * Product Sync Queue
 *
 * Manages async DB → Elasticsearch sync via BullMQ.
 * Redis is the transport; the queue itself never touches ES directly.
 *
 * Job types:
 *   index  – create / update an ES document for one product
 *   delete – remove a product from the ES index
 *   reindex – full rebuild of the products index
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ─── Redis connection for BullMQ ────────────────────────────────────────────
// BullMQ needs its own IORedis instance (it calls .duplicate() internally).
function createBullRedis(): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('[productQueue] REDIS_URL not set – using redis://localhost:6379');
    return new IORedis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null, // required by BullMQ
      lazyConnect: true,
    });
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  });
}

export const bullRedis = createBullRedis();

// ─── Job payload types ───────────────────────────────────────────────────────
export interface IndexJobData {
  productId: string;
}

export interface DeleteJobData {
  productId: string;
}

export interface ReindexJobData {
  requestedAt: string; // ISO timestamp so jobs are distinguishable in the UI
}

export type ProductJobData = IndexJobData | DeleteJobData | ReindexJobData;

// ─── Queue instance (singleton) ──────────────────────────────────────────────
const globalForQueue = globalThis as unknown as {
  productQueue: Queue<ProductJobData> | undefined;
};

function createQueue(): Queue<ProductJobData> {
  return new Queue<ProductJobData>('product-sync', {
    connection: bullRedis,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000, // 1s → 2s → 4s → 8s → 16s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  });
}

export const productQueue: Queue<ProductJobData> =
  globalForQueue.productQueue ?? createQueue();

// Keep singleton in development so hot-reload doesn't create duplicates
if (process.env.NODE_ENV !== 'production') {
  globalForQueue.productQueue = productQueue;
}
