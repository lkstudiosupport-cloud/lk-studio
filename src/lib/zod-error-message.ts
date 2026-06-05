import { z } from "zod";
import type { ZodError } from "zod";

function toText(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

function toOptionalText(val: unknown): string | undefined {
  if (val == null || val === "") return undefined;
  const s = String(val).trim();
  return s || undefined;
}

function toOptionalNumber(val: unknown): number | undefined {
  if (val == null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

export const formString = (min = 1) =>
  z.preprocess(toText, min > 0 ? z.string().min(min) : z.string());

export const formEmail = () => z.preprocess(toText, z.string().email());

export const formOptionalString = () =>
  z.preprocess(toOptionalText, z.string().optional());

export const formOptionalNumber = () =>
  z.preprocess(toOptionalNumber, z.number().optional());

export const formCode = () => z.preprocess(toText, z.string().min(4).max(8));

/** First user-facing message from a Zod validation error. */
export function zodErrorMessage(err: ZodError, fallback = "Invalid input"): string {
  const issue = err.issues[0];
  if (!issue) return fallback;

  const field = String(issue.path[0] ?? "");

  if (issue.code === "invalid_type" && issue.received === "null") {
    if (field === "email") return "Enter a valid email (e.g. name@gmail.com)";
    if (field === "password") return "Enter your password";
    if (field === "name") return "Enter your name";
    if (field === "phone") return "Enter your mobile number";
    return "Please fill all required fields";
  }

  if (field === "email") {
    return "Enter a valid email (e.g. name@gmail.com)";
  }
  if (field === "password") {
    return "Password must be at least 6 characters";
  }
  if (field === "name") {
    return "Enter your name";
  }
  if (field === "phone") {
    return "Enter your mobile number";
  }
  if (field === "code") {
    return "Enter the login code";
  }

  const msg = issue.message;
  if (msg.includes("received null") || msg.includes("Expected string")) {
    return "Please fill all required fields";
  }

  return msg || fallback;
}
