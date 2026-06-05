/**
 * Free a TCP port before starting dev (fixes EADDRINUSE on Windows).
 * Usage: node scripts/kill-port.mjs [port]
 */
import { execSync } from "node:child_process";

const port = Number(process.argv[2] || 3000);
if (!Number.isFinite(port) || port < 1 || port > 65535) {
  console.error("[kill-port] Invalid port:", process.argv[2]);
  process.exit(1);
}

const isWin = process.platform === "win32";

function killOnWindows() {
  let out = "";
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`[kill-port] Stopped PID ${pid} on port ${port}`);
    } catch {
      console.warn(`[kill-port] Could not stop PID ${pid}`);
    }
  }
}

function killOnUnix() {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
    for (const pid of out.split(/\s+/).filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`[kill-port] Stopped PID ${pid} on port ${port}`);
      } catch {
        console.warn(`[kill-port] Could not stop PID ${pid}`);
      }
    }
  } catch {
    /* nothing listening */
  }
}

if (isWin) killOnWindows();
else killOnUnix();
