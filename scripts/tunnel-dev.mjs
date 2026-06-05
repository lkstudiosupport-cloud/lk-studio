/**
 * Public HTTPS URL for phone testing — works on any Wi‑Fi or mobile data.
 * Requires dev server on port 3000 (npm run dev:mobile in another terminal, or dev:anywhere).
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = Number(process.env.PORT || 3000);

function waitForServer(maxMs = 90_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - start > maxMs) {
          reject(new Error(`Nothing listening on port ${port}. Run: npm run dev:mobile`));
          return;
        }
        setTimeout(tick, 800);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    tick();
  });
}

function writeAccessFiles(publicUrl, hostname) {
  const tunnelEnv = [
    `TUNNEL_URL=${publicUrl}`,
    `TUNNEL_HOST=${hostname}`,
    `CAPACITOR_SERVER_URL=${publicUrl}`,
    `# Updated ${new Date().toISOString()}`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(root, ".env.tunnel"), tunnelEnv, "utf8");

  const localPath = path.join(root, ".env.local");
  let local = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf8") : "";
  const strip = (key) => {
    local = local
      .split("\n")
      .filter((line) => !line.startsWith(`${key}=`))
      .join("\n");
  };
  strip("ALLOWED_DEV_ORIGIN");
  strip("TUNNEL_URL");
  strip("TUNNEL_HOST");
  local = `${local.trim()}\n\n# Auto — public dev URL (npm run tunnel)\nALLOWED_DEV_ORIGIN=${hostname}\nTUNNEL_URL=${publicUrl}\nTUNNEL_HOST=${hostname}\n`.trim() + "\n";
  fs.writeFileSync(localPath, local, "utf8");

  fs.writeFileSync(
    path.join(root, "public", "dev-access-url.txt"),
    `${publicUrl}\n`,
    "utf8"
  );
}

async function main() {
  console.log("\n[lk-studio] Waiting for dev server on port", port, "...");
  await waitForServer();

  const lt = await import("localtunnel");
  const tunnel = await lt.default({ port, local_host: "127.0.0.1" });
  const publicUrl = tunnel.url;
  const hostname = new URL(publicUrl).hostname;

  writeAccessFiles(publicUrl, hostname);

  console.log("\n========================================");
  console.log("  USE THIS ON YOUR PHONE (any network)");
  console.log("  " + publicUrl);
  console.log("========================================");
  console.log("\n  Login:  " + publicUrl + "/login/customer");
  console.log("  Demo:   9123456789 / demo123");
  console.log("\n  If loca.lt asks for a password, use your PC public IP:");
  console.log("  https://ifconfig.me");
  console.log("\n  Keep this window open. Ctrl+C stops the tunnel.");
  console.log("  Restart dev server after tunnel if pages look broken.\n");

  tunnel.on("close", () => {
    console.log("[lk-studio] Tunnel closed.");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    tunnel.close();
  });
}

main().catch((err) => {
  console.error("[lk-studio]", err.message || err);
  process.exit(1);
});
