#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL is required.");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(join(root, "apps/auth/package.json"));
const RedisModule = require("ioredis");
const Redis = RedisModule.default ?? RedisModule;
const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  connectTimeout: 5_000,
  maxRetriesPerRequest: 1,
});

try {
  await redis.connect();
  const response = await redis.ping();
  if (response !== "PONG") throw new Error(`unexpected Redis response: ${response}`);
  console.log("redis integration: ok");
} finally {
  redis.disconnect();
}
