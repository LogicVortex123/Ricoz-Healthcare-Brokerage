import { randomUUID } from "node:crypto";
import { Job, Notification, Offer, Task } from "./models";
import { transaction } from "./core";

export async function schedule(
  key: string,
  type: string,
  payload: any,
  runAt = new Date(),
) {
  await Job.updateOne(
    { key },
    { $setOnInsert: { type, payload, runAt, status: "pending", attempts: 0 } },
    { upsert: true },
  );
}
export async function planReminders() {
  const overdue = await Task.find({
    done: { $ne: true },
    dueAt: { $lt: new Date() },
  })
    .limit(500)
    .select("_id assignedTo");
  const day = new Date().toISOString().slice(0, 10);
  for (const task of overdue)
    await schedule(`task:${task._id}:${day}`, "overdueTask", {
      taskId: String(task._id),
      userId: task.assignedTo,
    });
}
export async function workOnce() {
  const owner = randomUUID();
  const now = new Date();
  const job: any = await Job.findOneAndUpdate(
    {
      runAt: { $lte: now },
      attempts: { $lt: 5 },
      $or: [
        { status: "pending" },
        { status: "running", leaseUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        status: "running",
        leaseOwner: owner,
        leaseUntil: new Date(Date.now() + 60000),
      },
      $inc: { attempts: 1 },
    },
    { sort: { runAt: 1 }, returnDocument: "after" },
  );
  if (!job) return false;
  try {
    await transaction(async (session) => {
      const lease = await Job.exists({
        _id: job._id,
        status: "running",
        leaseOwner: owner,
        leaseUntil: { $gt: new Date() },
      }).session(session);
      if (!lease) throw new Error("Lease expired");
      if (job.type !== "overdueTask") throw new Error("Unsupported job type");
      const task = await Task.findOne({
        _id: job.payload.taskId,
        assignedTo: job.payload.userId,
        done: { $ne: true },
        dueAt: { $lt: new Date() },
      }).session(session);
      if (task)
        await Notification.updateOne(
          { key: job.key },
          {
            $setOnInsert: {
              userId: job.payload.userId,
              message:
                "An assigned transition task is overdue. Open your workspace to review.",
            },
          },
          { upsert: true, session },
        );
      const saved = await Job.updateOne(
        { _id: job._id, leaseOwner: owner, leaseUntil: { $gt: new Date() } },
        {
          $set: { status: "completed" },
          $unset: { leaseOwner: "", leaseUntil: "" },
        },
        { session },
      );
      if (!saved.modifiedCount) throw new Error("Lease expired");
    });
  } catch {
    await Job.updateOne(
      { _id: job._id, leaseOwner: owner },
      {
        $set: {
          status: job.attempts >= 5 ? "failed" : "pending",
          lastError: "Job execution failed",
          runAt: new Date(Date.now() + 60000),
        },
        $unset: { leaseOwner: "", leaseUntil: "" },
      },
    );
  }
  return true;
}
export async function tick() {
  await Job.updateMany(
    {
      status: "running",
      attempts: { $gte: 5 },
      leaseUntil: { $lt: new Date() },
    },
    { $set: { status: "failed", lastError: "Lease attempts exhausted" } },
  );
  await Offer.updateMany(
    {
      status: "submitted",
      "terms.expiresAt": { $lte: new Date().toISOString() },
    },
    { $set: { status: "expired" } },
  );
  await planReminders();
  for (let i = 0; i < 50 && (await workOnce()); i++) {
    /* bounded leased batch */
  }
}
