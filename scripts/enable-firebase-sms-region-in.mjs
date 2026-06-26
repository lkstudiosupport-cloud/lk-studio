/** Enable India (+91) for Firebase Phone Auth SMS. */
import { readFileSync } from "fs";
import { GoogleAuth } from "google-auth-library";

const projectId = "lk-studio-29e6d";
const keyPath = "lk-studio-29e6d-firebase-adminsdk-fbsvc-6cad672f32.json";

async function main() {
  const credentials = JSON.parse(readFileSync(keyPath, "utf8"));
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("No access token");

  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=smsRegionConfig`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      smsRegionConfig: {
        allowlistOnly: { allowedRegions: ["IN"] },
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Failed:", res.status, text);
    process.exit(1);
  }
  console.log("SMS region IN enabled:", text.slice(0, 400));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
