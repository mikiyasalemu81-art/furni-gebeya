import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { uploadPrivateVerificationDocument } from "@/lib/verification-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as "id_front" | "id_back" | "trade_license" | null;

    if (!file || !docType) {
      return NextResponse.json(
        { error: "Both file and docType (id_front, id_back, trade_license) are required." },
        { status: 400 }
      );
    }

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Document size exceeds 10MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadPrivateVerificationDocument(
      user.id,
      docType,
      buffer,
      file.type,
      file.name
    );

    if (!result.success || !result.path) {
      return NextResponse.json(
        { error: result.error || "Failed to upload document." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      path: result.path,
      docType,
    });
  } catch (err: any) {
    console.error("[Upload Private Doc Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload document." },
      { status: 500 }
    );
  }
}
