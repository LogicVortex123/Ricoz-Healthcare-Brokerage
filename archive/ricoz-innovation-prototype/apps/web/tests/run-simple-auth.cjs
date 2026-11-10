const { spawnSync } = require("node:child_process");
const result = spawnSync(
  process.execPath,
  [require.resolve("@playwright/test/cli"), "test", "simple-auth.spec.ts"],
  { stdio: "inherit", env: { ...process.env, DEV_SIMPLE_AUTH: "true" } },
);
process.exitCode = result.status ?? 1;
