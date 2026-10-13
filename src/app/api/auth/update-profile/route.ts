import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const updated = await updateProfile({
      full_name: body?.full_name,
      avatar_url: body?.avatar_url,
      city: body?.city,
      subcity: body?.subcity,
      bio: body?.bio,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "User is not authenticated." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (err: any) {
    console.error("[Update Profile API Error]", err);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
