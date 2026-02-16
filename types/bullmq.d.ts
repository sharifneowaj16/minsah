/**
 * TypeScript Type Declarations for BullMQ + ioredis
 * 
 * This file resolves type conflicts between:
 * - Project's ioredis@5.4.1
 * - BullMQ's internal ioredis types
 * 
 * Place this in your project root or in a types/ directory
 */

declare module 'bullmq' {
  import { Redis, RedisOptions } from 'ioredis';

  export type ConnectionOptions = Redis | RedisOptions;

  export interface QueueOptions {
    connection?: ConnectionOptions;
    defaultJobOptions?: DefaultJobOptions;
    prefix?: string;
    streams?: {
      events?: {
        maxLen?: number;
      };
    };
  }

  export interface DefaultJobOptions {
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
    delay?: number;
    priority?: number;
    removeOnComplete?: boolean | number | { age?: number; count?: number };
    removeOnFail?: boolean | number | { age?: number; count?: number };
    repeat?: {
      pattern?: string;
      every?: number;
      limit?: number;
    };
  }

  export interface WorkerOptions {
    connection?: ConnectionOptions;
    concurrency?: number;
    limiter?: {
      max: number;
      duration: number;
    };
    lockDuration?: number;
    lockRenewTime?: number;
    maxStalledCount?: number;
    stalledInterval?: number;
  }

  export interface Job<T = any> {
    id: string | undefined;
    name: string;
    data: T;
    opts: any;
    progress: number | object;
    attemptsMade: number;
    stacktrace: string[];
    timestamp: number;
    finishedOn?: number;
    processedOn?: number;
    returnvalue: any;
    
    updateProgress(progress: number | object): Promise<void>;
    log(row: string): Promise<number>;
    getState(): Promise<string>;
    update(data: Partial<T>): Promise<void>;
    remove(): Promise<void>;
    retry(state?: 'completed' | 'failed'): Promise<void>;
    discard(): Promise<void>;
    promote(): Promise<void>;
  }

  export class Queue<T = any> {
    constructor(name: string, opts?: QueueOptions);

    add(name: string, data: T, opts?: DefaultJobOptions): Promise<Job<T>>;
    addBulk(jobs: Array<{ name: string; data: T; opts?: DefaultJobOptions }>): Promise<Job<T>[]>;
    
    pause(): Promise<void>;
    resume(): Promise<void>;
    isPaused(): Promise<boolean>;
    
    getJob(jobId: string): Promise<Job<T> | undefined>;
    getJobs(
      types?: Array<'completed' | 'failed' | 'delayed' | 'active' | 'wait' | 'paused'>,
      start?: number,
      end?: number,
      asc?: boolean
    ): Promise<Job<T>[]>;
    
    getJobCounts(
      ...types: Array<'completed' | 'failed' | 'delayed' | 'active' | 'wait' | 'paused'>
    ): Promise<{ [index: string]: number }>;
    
    empty(): Promise<void>;
    close(): Promise<void>;
    
    on(event: 'error', callback: (err: Error) => void): this;
    on(event: 'waiting', callback: (jobId: string) => void): this;
    on(event: 'active', callback: (job: Job<T>, prev: string) => void): this;
    on(event: 'completed', callback: (job: Job<T>, result: any) => void): this;
    on(event: 'failed', callback: (job: Job<T> | undefined, err: Error) => void): this;
    on(event: 'progress', callback: (job: Job<T>, progress: number | object) => void): this;
    on(event: 'removed', callback: (job: Job<T>) => void): this;
    on(event: 'cleaned', callback: (jobs: string[], type: string) => void): this;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export class Worker<T = any> {
    constructor(
      name: string,
      processor: (job: Job<T>) => Promise<any>,
      opts?: WorkerOptions
    );

    run(): Promise<void>;
    close(force?: boolean): Promise<void>;
    pause(doNotWaitActive?: boolean): Promise<void>;
    resume(): void;
    
    on(event: 'completed', callback: (job: Job<T>, result: any) => void): this;
    on(event: 'failed', callback: (job: Job<T> | undefined, err: Error) => void): this;
    on(event: 'error', callback: (err: Error) => void): this;
    on(event: 'active', callback: (job: Job<T>, prev: string) => void): this;
    on(event: 'progress', callback: (job: Job<T>, progress: number | object) => void): this;
    on(event: 'stalled', callback: (jobId: string) => void): this;
    on(event: 'closed', callback: () => void): this;
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export class QueueEvents {
    constructor(name: string, opts?: { connection?: ConnectionOptions });
    
    on(event: 'completed', callback: (args: { jobId: string; returnvalue: string }) => void): this;
    on(event: 'failed', callback: (args: { jobId: string; failedReason: string }) => void): this;
    on(event: 'waiting', callback: (args: { jobId: string }) => void): this;
    on(event: 'active', callback: (args: { jobId: string; prev?: string }) => void): this;
    on(event: 'progress', callback: (args: { jobId: string; data: number | object }) => void): this;
    on(event: 'removed', callback: (args: { jobId: string; prev: string }) => void): this;
    on(event: 'cleaned', callback: (args: { count: string }) => void): this;
    on(event: string, callback: (args: any) => void): this;
    
    close(): Promise<void>;
  }

  export class QueueScheduler {
    constructor(name: string, opts?: { connection?: ConnectionOptions });
    close(): Promise<void>;
  }

  export class FlowProducer {
    constructor(opts?: { connection?: ConnectionOptions });
    
    add(flow: {
      name: string;
      queueName: string;
      data?: any;
      opts?: DefaultJobOptions;
      children?: Array<{
        name: string;
        queueName: string;
        data?: any;
        opts?: DefaultJobOptions;
      }>;
    }): Promise<any>;
    
    close(): Promise<void>;
  }
}