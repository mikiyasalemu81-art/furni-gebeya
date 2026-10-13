import { NextRequest, NextResponse } from "next/server";
import { completeOnboarding } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const updated = await completeOnboarding();
    if (!updated) {
      return NextResponse.json(
        { error: "You must be logged in to complete onboarding." },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to mark onboarding complete." },
      { status: 500 }
    );
  }
}
