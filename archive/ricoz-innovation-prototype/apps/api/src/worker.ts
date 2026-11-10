import "dotenv/config";
import mongoose from "mongoose";
import { tick } from "./platform/jobs";
async function start() {
  await mongoose.connect(process.env.MONGODB_URI || "");
  let busy = false;
  const run = async () => {
    if (busy) return;
    busy = true;
    try {
      await tick();
    } catch {
      console.error("Background batch failed; will retry.");
    } finally {
      busy = false;
    }
  };
  await run();
  const timer = setInterval(run, 30000);
  const stop = () => {
    clearInterval(timer);
    mongoose.disconnect().finally(() => process.exit(0));
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
start().catch(() => {
  console.error("Worker database connection failed");
  process.exitCode = 1;
});
