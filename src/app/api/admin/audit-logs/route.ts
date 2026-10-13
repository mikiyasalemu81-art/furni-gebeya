import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { getAdminAuditLogs } from "@/lib/verification-service";

export async function GET() {
  try {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const logs = await getAdminAuditLogs(50);
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
