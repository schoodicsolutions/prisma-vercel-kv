# prisma-vercel-kv Extension for Prisma Client

prisma-vercel-kv is an npm package that enhances Prisma Client by adding caching capabilities with Vercel KV as the storage solution. It provides a simple and efficient way to cache database read operations and invalidate them when writes occur, thereby optimizing the performance of your applications.

## Features

- **Read Operation Caching**: Caches the results of read operations to reduce database load.
- **Write Operation Cache Invalidation**: Automatically invalidates cache upon any write operation to maintain data integrity.
- **Environment-based TTL Configuration**: Easily configure cache expiration through environment variables.
- **Seamless Vercel KV Integration**: Built to integrate effortlessly with Vercel's distributed key-value store.

## Installation

Install prisma-vercel-kv by running the following command in your project:

```bash
npm install prisma-vercel-kv
```

Ensure that you have Prisma Client set up in your project, as prisma-vercel-kv is designed to extend its functionality. Also make sure you have Vercel KV installed, and the appropriate .env vars set up in your project for authentication.

## Usage

Create an extended Prisma Client instance with prisma-vercel-kv to leverage caching in your database operations.

### Creating an Extended Client

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaVercelKV } from 'prisma-vercel-kv';

const prisma = new PrismaClient();

const prismaWithKV = prisma.$extends(PrismaVercelKV);
```

### Performing Queries with Caching

With the extended client, perform your queries as usual, and prisma-vercel-kv will handle caching:

```typescript
// Cached read operation
const users = await prismaWithKV.user.findMany();

// Write operation that triggers cache invalidation
await prismaWithKV.user.create({
  data: { name: 'Dana', email: 'dana@example.com' },
});
```

### Cache Invalidation

prisma-vercel-kv ensures that the cache is invalidated appropriately after write operations to guarantee that subsequent reads fetch the latest data.

## Configuration

To set the Time-To-Live (TTL) for cache entries, define `PRISMA_VERCEL_KV_TTL` in your `.env` file:

```
# .env
PRISMA_VERCEL_KV_TTL=86400 # TTL in seconds, e.g., 86400 for 24 hours
```

Adjust the TTL according to your application's caching requirements. It is set to 3600 by default.

## Limitations

- Assumes JSON-compatible serialization of cached data.
- Does not support nested operations within the `query` extension type.
- Broad cache invalidation may affect more cache entries than necessary for certain types of write operations.

## Contributing

We welcome contributions to prisma-vercel-kv. Visit the GitHub repository to report issues, suggest features, or make pull requests.

## License

prisma-vercel-kv is available under the MIT License. Refer to the LICENSE file in the GitHub repository for detailed information.

---

For comprehensive guidance on Prisma Client extensions, consult the [Prisma documentation](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions).