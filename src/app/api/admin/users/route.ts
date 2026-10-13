import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile, memoryProfiles, setUserSuspension } from "@/lib/auth-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// GET /api/admin/users -> List all users for admin management
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data } = await admin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          return NextResponse.json({ users: data });
        }
      } catch (e) {
        console.error("[Supabase fetch users error]", e);
      }
    }

    const users = Array.from(memoryProfiles.values());
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users -> Suspend / Reactivate user
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, isSuspended, reason } = await req.json();
    if (!userId || typeof isSuspended !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await setUserSuspension(userId, isSuspended, reason);

    return NextResponse.json({
      success: true,
      message: isSuspended ? "User account has been suspended." : "User account has been reactivated.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user status" }, { status: 500 });
  }
}
