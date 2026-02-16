/**
 * Product Sync Worker
 *
 * Consumes jobs from the "product-sync" BullMQ queue and syncs
 * the Elasticsearch index to match the PostgreSQL database.
 *
 * Job types handled:
 *   index   – fetch product from DB, transform, upsert into ES
 *   delete  – remove product document from ES
 *   reindex – full rebuild (fetch all products in batches, bulk-index)
 *
 * Retry policy: 5 attempts with exponential back-off (configured on the Queue).
 *
 * Run this process separately from Next.js:
 *   npx tsx lib/workers/productWorker.ts
 */

import { Worker, type Job } from 'bullmq';
import { bullRedis, type ProductJobData, type IndexJobData, type DeleteJobData } from '@/lib/queue/productQueue';
import { transformProductToES } from '@/lib/search/productTransformer';
import { esClient, PRODUCT_INDEX } from '@/lib/elasticsearch';
import prisma from '@/lib/prisma';

const BATCH_SIZE = 500;

// ─── Prisma include helper ─────────────────────────────────────────────────

const productInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  category: { include: { parent: { include: { parent: true } } } },
  brand: true,
  reviews: { select: { rating: true } },
} as const;

// ─── Job handlers ─────────────────────────────────────────────────────────────

async function handleIndex(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });

  if (!product) {
    console.warn(`[worker] Product ${productId} not found in DB – skipping index`);
    return;
  }

  const doc = transformProductToES(product);

  await esClient.index({
    index: PRODUCT_INDEX,
    id: productId,
    document: doc,
  });

  console.log(`[worker] Indexed product ${productId} (${product.name})`);
}

async function handleDelete(productId: string): Promise<void> {
  try {
    await esClient.delete({ index: PRODUCT_INDEX, id: productId });
    console.log(`[worker] Deleted product ${productId} from ES index`);
  } catch (err: unknown) {
    // 404 just means it was never indexed – that is fine
    if (
      typeof err === 'object' &&
      err !== null &&
      'meta' in err &&
      (err as { meta: { statusCode: number } }).meta?.statusCode === 404
    ) {
      console.warn(`[worker] Product ${productId} was not in ES index – nothing to delete`);
      return;
    }
    throw err;
  }
}

async function handleReindex(): Promise<void> {
  console.log('[worker] Starting full reindex…');

  let skip = 0;
  let totalIndexed = 0;

  for (;;) {
    const products = await prisma.product.findMany({
      skip,
      take: BATCH_SIZE,
      include: productInclude,
    });

    if (products.length === 0) break;

    const operations = products.flatMap((p) => [
      { index: { _index: PRODUCT_INDEX, _id: p.id } },
      transformProductToES(p),
    ]);

    const { errors, items } = await esClient.bulk({ operations, refresh: false });

    if (errors) {
      const failed = items.filter((i) => i.index?.error);
      console.error(`[worker] Bulk reindex had ${failed.length} errors:`, failed);
    }

    totalIndexed += products.length;
    console.log(`[worker] Reindex progress: ${totalIndexed} products indexed`);

    skip += BATCH_SIZE;
    if (products.length < BATCH_SIZE) break;
  }

  // Refresh once at the end to make all docs searchable
  await esClient.indices.refresh({ index: PRODUCT_INDEX });
  console.log(`[worker] Full reindex complete – ${totalIndexed} products`);
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export function startProductWorker(): Worker {
  const worker = new Worker<ProductJobData>(
    'product-sync',
    async (job: Job<ProductJobData>) => {
      const { name, data } = job;

      try {
        if (name === 'index') {
          const { productId } = data as IndexJobData;
          await handleIndex(productId);

        } else if (name === 'delete') {
          const { productId } = data as DeleteJobData;
          await handleDelete(productId);

        } else if (name === 'reindex') {
          await handleReindex();

        } else {
          console.warn(`[worker] Unknown job type "${name}" – skipping`);
        }
      } catch (err) {
        console.error(`[worker] Job "${name}" (id=${job.id}) failed:`, err);
        throw err; // let BullMQ retry according to the queue's back-off config
      }
    },
    {
      connection: bullRedis,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} (${job?.name}) failed (attempt ${job?.attemptsMade}):`, err?.message);
  });

  worker.on('error', (err) => {
    console.error('[worker] Worker error:', err);
  });

  console.log('[worker] Product sync worker started – listening on queue "product-sync"');
  return worker;
}

// ─── Standalone entry point ───────────────────────────────────────────────────
// Run with:  npx tsx lib/workers/productWorker.ts

if (process.argv[1]?.endsWith('productWorker.ts') || process.argv[1]?.endsWith('productWorker.js')) {
  startProductWorker();

  // Keep the process alive
  process.on('SIGTERM', async () => {
    console.log('[worker] SIGTERM received – shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[worker] SIGINT received – shutting down gracefully');
    process.exit(0);
  });
}
