/** Verify/update Firebase Auth for LK Studio Phone OTP. */
import { readFileSync } from "fs";
import { GoogleAuth } from "google-auth-library";

const projectId = "lk-studio-29e6d";
const keyPath = "lk-studio-29e6d-firebase-adminsdk-fbsvc-6cad672f32.json";

const authorizedDomains = [
  "localhost",
  "lk-studio-1.onrender.com",
  "lk-studio-29e6d.firebaseapp.com",
  "lk-studio-29e6d.web.app",
];

const testPhoneNumbers = {
  "+919876543210": "123456",
  "+919876543219": "123456",
  "+919123456789": "123456",
};

async function getToken() {
  const credentials = JSON.parse(readFileSync(keyPath, "utf8"));
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("No access token");
  return token.token;
}

async function getConfig(token) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET config failed: ${res.status} ${text}`);
  return JSON.parse(text);
}

async function patchConfig(token, updateMask, body) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=${updateMask}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PATCH failed (${updateMask}): ${res.status} ${text}`);
  return JSON.parse(text);
}

async function main() {
  const token = await getToken();

  console.log("Updating Firebase Authentication providers…\n");

  await patchConfig(token, "signIn.phoneNumber.enabled", {
    signIn: { phoneNumber: { enabled: true } },
  });
  console.log("✓ Phone sign-in: enabled");

  await patchConfig(token, "smsRegionConfig", {
    smsRegionConfig: {
      allowlistOnly: { allowedRegions: ["IN"] },
    },
  });
  console.log("✓ SMS region: India (IN)");

  await patchConfig(token, "signIn.phoneNumber.testPhoneNumbers", {
    signIn: { phoneNumber: { testPhoneNumbers } },
  });
  console.log("✓ Test phone numbers configured");

  try {
    await patchConfig(token, "authorizedDomains", {
      authorizedDomains,
    });
    console.log("✓ Authorized domains:", authorizedDomains.join(", "));
  } catch (err) {
    console.warn("⚠ Authorized domains (set manually in Console if needed):", err);
  }

  const config = await getConfig(token);
  const phone = config.signIn?.phoneNumber;
  console.log("\nCurrent status:");
  console.log("  Phone enabled:", phone?.enabled ?? false);
  console.log("  Test phones:", Object.keys(phone?.testPhoneNumbers ?? {}).length);
  console.log("  Authorized domains:", (config.authorizedDomains ?? []).join(", ") || "(none in API response)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
