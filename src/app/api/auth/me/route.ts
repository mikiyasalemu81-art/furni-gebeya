import { NextResponse } from "next/server";
import { getCurrentUserProfile, clearUserSession } from "@/lib/auth-session";

export async function GET() {
  try {
    const profile = await getCurrentUserProfile();
    return NextResponse.json({ user: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await clearUserSession();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
