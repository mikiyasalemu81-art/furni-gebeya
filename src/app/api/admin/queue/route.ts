import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  getVerificationQueue,
  createSignedDocumentUrl,
} from "@/lib/verification-service";

export async function GET(req: NextRequest) {
  try {
    // 1. Server-side Admin Role Enforcement
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const queue = await getVerificationQueue(status);

    // 2. Generate short-lived signed URLs (10 min expiry) for private documents
    const queueWithSignedUrls = await Promise.all(
      queue.map(async (item) => {
        const [idFrontUrl, idBackUrl, licenseUrl] = await Promise.all([
          createSignedDocumentUrl(item.id_front_path, 600),
          createSignedDocumentUrl(item.id_back_path, 600),
          createSignedDocumentUrl(item.trade_license_path, 600),
        ]);

        return {
          ...item,
          id_front_signed_url: idFrontUrl,
          id_back_signed_url: idBackUrl,
          trade_license_signed_url: licenseUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      requests: queueWithSignedUrls,
    });
  } catch (err: any) {
    console.error("[Admin Queue Error]", err);
    return NextResponse.json(
      { error: "Internal server error fetching admin queue." },
      { status: 500 }
    );
  }
}
