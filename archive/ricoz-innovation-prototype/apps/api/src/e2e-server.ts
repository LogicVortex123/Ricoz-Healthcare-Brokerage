import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs/promises";
async function main() {
  process.env.NODE_ENV = "test";
  process.env.DEV_EMAIL_OUTBOX = "true";
  process.env.DEV_SCANNER = "synthetic";
  process.env.ALLOW_DEMO_SEED = "true";
  process.env.WEB_ORIGIN = "http://localhost:3100";
  process.env.NDA_VERSION = "synthetic-v1";
  process.env.NDA_TEXT =
    "DEVELOPMENT SYNTHETIC AGREEMENT ONLY. Not legally reviewed. No patient records.";
  process.env.PRIVATE_STORAGE_PATH = path.resolve(".e2e-private");
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve("../../.mongodb-binaries");
  const mongo = await MongoMemoryReplSet.create({
    binary: { version: "8.0.17" },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(mongo.getUri());
  const { seed } = await import("./seed");
  await seed();
  const { app } = await import("./platform/app");
  const server = app.listen(4100, "127.0.0.1", () =>
    console.log("E2E API ready"),
  );
  const stop = () =>
    server.close(async () => {
      await mongoose.disconnect();
      await mongo.stop();
      await fs.rm(process.env.PRIVATE_STORAGE_PATH!, {
        recursive: true,
        force: true,
      });
      process.exit(0);
    });
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
