import "dotenv/config";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import fs from "node:fs/promises";
import path from "node:path";
async function start() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Development MongoDB launcher is disabled in production");
  process.env.MONGOMS_DOWNLOAD_DIR ||= path.resolve("../../.mongodb-binaries");
  const port = Number(process.env.DEV_MONGO_PORT || 27017);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid development MongoDB port");
  const dbPath = path.resolve(
    process.env.DEV_MONGO_PATH ||
      (port === 27017 ? ".dev-mongo" : `.dev-mongo-${port}`),
  );
  await fs.mkdir(dbPath, { recursive: true });
  const mongo = await MongoMemoryReplSet.create({
    instanceOpts: [{ port, dbPath }],
    binary: { version: "8.0.17" },
    replSet: { count: 1, storageEngine: "wiredTiger", name: "rs0" },
  });
  console.log(
    `Development MongoDB replica set listening on 127.0.0.1:${port}. Persistent development data directory configured.`,
  );
  const stop = () => {
    mongo.stop({ doCleanup: false }).finally(() => process.exit(0));
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
start().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
