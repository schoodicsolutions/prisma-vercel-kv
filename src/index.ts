/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Prisma } from '@prisma/client';
import type { Operation } from '@prisma/client/runtime/library';
import { kv } from '@vercel/kv';
import { createHash } from 'crypto';

const readOps = new Set<Operation>([
  'findFirst',
  'findUnique',
  'findMany',
  '$queryRaw',
]);

const writeOps = new Set<Operation>([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  '$executeRaw',
]);

const USER_TTL = process.env.PRISMA_VERCEL_KV_TTL
  ? Number(process.env.PRISMA_VERCEL_KV_TTL)
  : null;

const EXPIRY_TIME = USER_TTL ?? 3600; // 1 hour by default
const DEFAULT_MODEL_KEY = '$$NO_MODEL$$';

const generateCacheKey = (
  model: string | undefined,
  operation: string,
  args: any,
): string => {
  const hash = createHash('sha256').update(JSON.stringify(args)).digest('hex');
  return `PrismaKV_${model ?? DEFAULT_MODEL_KEY}.${operation}.${hash}`;
};

const getFromCacheOrQuery = async (
  key: string,
  query: (args: any) => Promise<unknown>,
  args: any,
): Promise<unknown> => {
  try {
    const cacheResult = await kv.get(key);
    if (cacheResult) return cacheResult;

    const queryResult = await query(args);
    await kv.set(key, queryResult, { ex: EXPIRY_TIME });
    return queryResult;
  } catch (e) {
    console.error('prisma-vercel-kv: Cache operation failed.', e);
    return query(args);
  }
};

const invalidateCache = async (model?: string) => {
  const keysToDelete: string[] = [];
  for await (const key of kv.scanIterator()) {
    if (key.startsWith('PrismaKV_' + (model ?? DEFAULT_MODEL_KEY) + '.')) {
      keysToDelete.push(key);
    }
  }
  await Promise.all(keysToDelete.map((key) => kv.del(key)));
};

const PrismaVercelKV = Prisma.defineExtension({
  name: 'PrismaKV',
  query: {
    async $allOperations({ model, operation, args, query }) {
      if (writeOps.has(operation as Operation)) {
        await invalidateCache(model);
        return query(args);
      }
      if (readOps.has(operation as Operation)) {
        const key = generateCacheKey(model, operation, args);
        return getFromCacheOrQuery(key, query, args);
      }
      return query(args);
    },
  },
});

export default PrismaVercelKV;
