import "dotenv/config";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { auth, account, authenticate } from "./auth";
import { publicRoutes, practices } from "./practices";
import { deals } from "./deals";
import { documents } from "./documents";
import { admin } from "./admin";
import { sensitiveLimit } from "./limits";
import { valuations } from './valuations';
export const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY_HOPS)
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
app.use(helmet());
app.use((req, res, next) => {
  const requestId = randomUUID();
  (req as any).requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "3mb" }));
app.get("/api/v1/health", (_req, res) =>
  res.json({ success: true, data: { live: true } }),
);
app.get("/api/v1/ready", async (_req, res) => {
  let ready = false;
  try {
    const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
    ready = mongoose.connection.readyState === 1 && !!hello?.setName;
  } catch {}
  res.status(ready ? 200 : 503).json({
    success: ready,
    data: {
      database: ready ? "replicaSet" : "unavailable",
      scanner:
        process.env.DEV_SCANNER === "synthetic"
          ? "development-only"
          : "unconfigured",
    },
  });
});
app.use("/api/v1", (req, res, next) => {
  if (mongoose.connection.readyState !== 1)
    return res.status(503).json({
      success: false,
      error: { message: "MongoDB unavailable; operation was not completed." },
      requestId: res.locals.requestId,
    });
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.get("Origin") &&
    req.get("Origin") !== (process.env.WEB_ORIGIN || "http://localhost:3000")
  )
    return res
      .status(403)
      .json({ success: false, error: { message: "Origin not allowed" } });
  next();
});
app.use("/api/v1/auth", auth);
app.use("/api/v1", publicRoutes);
app.use(
  "/api/v1",
  authenticate,
  sensitiveLimit,
  account,
  practices,
  valuations,
  documents,
  deals,
  admin,
);
app.use((_req, res) =>
  res.status(404).json({
    success: false,
    error: { message: "Endpoint not found" },
    requestId: res.locals.requestId,
  }),
);
app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status =
      error instanceof ZodError
        ? 422
        : error.code === 11000 || error.name === "VersionError"
          ? 409
          : error.name === "CastError"
            ? 404
            : error.type === "entity.too.large"
              ? 413
              : error.type === "entity.parse.failed"
                ? 422
                : error.status || 500;
    res.status(status).json({
      success: false,
      error: {
        message:
          error instanceof ZodError
            ? "Validation failed"
            : status >= 500
              ? "Service could not complete the operation"
              : error.code === 11000
                ? "Conflicting record or exclusive decision"
                : error.name === "VersionError"
                  ? "Record changed; refresh and retry"
                  : error.message,
        ...(error instanceof ZodError
          ? {
              fields: error.issues.map((x) => ({
                path: x.path.join("."),
                message: x.message,
              })),
            }
          : {}),
      },
      requestId: res.locals.requestId,
    });
  },
);
export function validateConfig() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Production disabled until approved storage, scanner and email adapters are implemented and readiness review is complete",
    );
}
