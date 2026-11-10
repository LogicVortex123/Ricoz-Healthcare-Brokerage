import mongoose from "mongoose";
import { app, validateConfig } from "./platform/app";
import { models } from "./platform/models";
async function start() {
  validateConfig();
  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
  });
  const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
  if (!hello.setName) throw new Error("MongoDB replica set required");
  await Promise.all(models.map((m) => m.init()));
  const server = app.listen(Number(process.env.PORT || 4000), "127.0.0.1", () =>
    console.log("Healthcare Transition API listening"),
  );
  const stop = () =>
    server.close(() => {
      mongoose.disconnect().finally(() => process.exit(0));
    });
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
start().catch((e) => {
  console.error(e instanceof Error ? e.message : "Startup failed");
  process.exitCode = 1;
});
