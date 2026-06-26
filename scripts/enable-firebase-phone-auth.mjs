/** One-off: enable Firebase Phone sign-in via Identity Toolkit Admin API. */
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

  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn.phoneNumber.enabled`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signIn: { phoneNumber: { enabled: true } },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Failed:", res.status, text);
    process.exit(1);
  }
  console.log("Phone auth enabled:", text.slice(0, 500));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
