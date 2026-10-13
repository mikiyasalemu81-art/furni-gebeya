import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  approveVerification,
  rejectVerification,
  requestMoreDocuments,
} from "@/lib/verification-service";

export async function POST(req: NextRequest) {
  try {
    // 1. Server-side Admin Role Enforcement
    const adminUser = await getCurrentUserProfile();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, action, reason, docType } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Both requestId and action are required." },
        { status: 400 }
      );
    }

    let result;

    if (action === "approve") {
      result = await approveVerification(adminUser, requestId, docType || "all");
    } else if (action === "reject") {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required." },
          { status: 400 }
        );
      }
      result = await rejectVerification(adminUser, requestId, reason.trim());
    } else if (action === "request_more_documents") {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: "Instructions detailing the requested documents are required." },
          { status: 400 }
        );
      }
      result = await requestMoreDocuments(adminUser, requestId, reason.trim());
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be approve, reject, or request_more_documents." },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification request ${action}ed successfully.`,
    });
  } catch (err: any) {
    console.error("[Admin Action Error]", err);
    return NextResponse.json(
      { error: "Internal server error executing admin action." },
      { status: 500 }
    );
  }
}
