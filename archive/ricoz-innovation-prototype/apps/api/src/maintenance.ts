import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { Document } from "./platform/models";
import { storageRoot } from "./platform/documents";
async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "");
  const cutoff = new Date(Date.now() - 24 * 3600000);
  await Document.updateMany(
    { state: "initiated", createdAt: { $lt: cutoff } },
    { $set: { state: "failed" } },
  );
  const entries = await fs.readdir(storageRoot()).catch(() => []);
  for (const key of entries) {
    if (!/^[a-f0-9]{64}$/.test(key)) continue;
    const file = path.join(storageRoot(), key);
    const stat = await fs.stat(file);
    if (stat.mtime > cutoff) continue;
    const d: any = await Document.findOne({ key });
    if (
      !d ||
      (d.state === "deleted" &&
        !d.hold &&
        (!d.retainUntil || d.retainUntil < new Date()))
    )
      await fs.unlink(file);
  }
  console.log("Failed uploads marked and eligible orphan files removed.");
}
run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
