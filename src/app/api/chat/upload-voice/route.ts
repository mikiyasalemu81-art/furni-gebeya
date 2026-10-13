import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { uploadPrivateVoiceNote, createSignedVoiceUrl } from "@/lib/voice-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const duration = formData.get("duration") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
    }

    // Max 10MB voice note, max 2 minutes
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Voice message file too large." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadRes = await uploadPrivateVoiceNote(
      user.id,
      buffer,
      file.type || "audio/webm",
      "webm"
    );

    if (!uploadRes.success || !uploadRes.path) {
      return NextResponse.json({ error: "Failed to upload audio." }, { status: 500 });
    }

    // Generate short-lived signed URL for playback
    const signedUrl = await createSignedVoiceUrl(uploadRes.path, 3600);

    return NextResponse.json({
      success: true,
      audioUrl: signedUrl,
      storagePath: uploadRes.path,
      durationSeconds: duration ? Math.round(Number(duration)) : 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed uploading voice message" },
      { status: 500 }
    );
  }
}
