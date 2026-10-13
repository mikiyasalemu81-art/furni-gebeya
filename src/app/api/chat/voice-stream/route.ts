import { NextRequest, NextResponse } from "next/server";
import { getLocalVoiceFile, validateVoiceSignedToken } from "@/lib/voice-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    const expires = searchParams.get("expires");
    const token = searchParams.get("token");

    if (!path || !expires || !token) {
      return new NextResponse("Unauthorized or missing signature", { status: 401 });
    }

    if (!validateVoiceSignedToken(path, expires, token)) {
      return new NextResponse("Signed URL is invalid or expired", { status: 403 });
    }

    const file = getLocalVoiceFile(path);
    if (!file) {
      return new NextResponse("Voice note not found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "audio/webm",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
