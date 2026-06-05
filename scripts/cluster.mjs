/**
 * Run multiple Next.js workers on one machine for more concurrent users.
 * Usage: npm run start:cluster
 * Set WORKERS=4 (default: CPU count, max 8).
 */
import { spawn } from "node:child_process";
import os from "node:os";

const workers = Math.min(
  Number(process.env.WORKERS) || os.cpus().length,
  8
);

console.log(`[lk-studio] Starting ${workers} workers on port ${process.env.PORT ?? 3000}`);

for (let i = 0; i < workers; i++) {
  const child = spawn("npx", ["next", "start"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_ENV: "production" },
  });
  child.on("exit", (code) => {
    console.error(`Worker ${i} exited with code ${code}`);
    process.exit(code ?? 1);
  });
}
