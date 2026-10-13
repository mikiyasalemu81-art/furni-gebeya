import { NextRequest, NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    await clearUserSession();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to log out cleanly." },
      { status: 500 }
    );
  }
}
