"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseApiResponse } from "@/lib/parse-api-response";
import { PhoneInput } from "@/components/PhoneInput";
import { getOrCreateDeviceId } from "@/lib/device-id";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone,
          password: fd.get("password"),
          role: "ADMIN",
          deviceId: getOrCreateDeviceId(),
        }),
      });

      const data = await parseApiResponse(res);
      setLoading(false);

      if (!res.ok) {
        setError(String(data.error ?? "Login failed"));
        return;
      }

      router.push(String(data.redirect ?? "/admin"));
      router.refresh();
    } catch {
      setLoading(false);
      setError("Cannot reach server.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PhoneInput value={phone} onChange={setPhone} label="Admin mobile" required />
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input-premium w-full"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Signing in…" : "Admin sign in"}
      </button>
    </form>
  );
}
