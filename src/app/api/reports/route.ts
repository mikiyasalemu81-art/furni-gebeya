import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  createReport,
  getAdminReports,
  moderateReport,
  getAdminReviews,
  moderateReview,
} from "@/lib/marketplace-service";

// GET /api/reports -> admin gets list of reports or reviews
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'reports' or 'reviews'
    const status = searchParams.get("status") || "all";

    if (type === "reviews") {
      const reviews = await getAdminReviews();
      return NextResponse.json({ reviews });
    }

    const reports = await getAdminReports(status);
    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch reports" }, { status: 500 });
  }
}

// POST /api/reports -> User submits a report OR Admin moderates
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Admin Moderation
    if (action === "moderate_report") {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const { reportId, status, adminNotes } = body;
      await moderateReport({
        reportId,
        adminId: user.id,
        status,
        adminNotes,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "moderate_review") {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const { reviewId, status } = body;
      await moderateReview(reviewId, status);
      return NextResponse.json({ success: true });
    }

    // Normal User submitting a report
    const { reportType, targetListingId, targetUserId, targetTitleOrName, reason, details } = body;
    if (!reportType || !reason) {
      return NextResponse.json({ error: "Report type and reason are required." }, { status: 400 });
    }

    const report = await createReport({
      reporterId: user.id,
      reporterName: user.full_name,
      reporterPhone: user.phone_number,
      reportType,
      targetListingId,
      targetUserId,
      targetTitleOrName,
      reason,
      details,
    });

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed processing report request" }, { status: 500 });
  }
}
