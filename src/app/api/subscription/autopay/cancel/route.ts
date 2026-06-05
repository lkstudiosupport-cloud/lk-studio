import { NextResponse } from "next/server";

/** Autopay cancellation is not exposed in the app — mandate stays active after signup. */
export async function POST() {
  return NextResponse.json(
    { error: "Autopay cannot be cancelled from the app" },
    { status: 403 }
  );
}
