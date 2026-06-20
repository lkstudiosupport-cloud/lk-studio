/** @deprecated Use scripts/seed-maggam-catalog.ts — kept for npm run db:seed-maggam-small */
import { spawnSync } from "child_process";

const args = ["scripts/seed-maggam-catalog.ts", "--tier=small", ...process.argv.slice(2)];
const result = spawnSync("tsx", args, { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
