/**
 * One command: free port 3000, start dev server, open public tunnel URL.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const node = process.execPath;

/** Spawn without shell — fixes Windows paths like C:\Program Files\... */
function runNodeScript(scriptName, args = []) {
  const scriptPath = path.join(__dirname, scriptName);
  return new Promise((resolve, reject) => {
    const child = spawn(node, [scriptPath, ...args], {
      cwd: root,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

function startDevServerBackground() {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(node, [nextBin, "dev", "-H", "0.0.0.0", "-p", String(port)], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    shell: false,
    windowsHide: true,
  });
  child.unref();
}

console.log("[lk-studio] Stopping old server on port 3000...");
await runNodeScript("kill-port.mjs", [String(port)]);

console.log("[lk-studio] Starting dev server in background...");
startDevServerBackground();

console.log("[lk-studio] Opening public tunnel (any Wi‑Fi / mobile data)...");
await runNodeScript("tunnel-dev.mjs");
