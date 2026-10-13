import { NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size exceeds 5MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImageToCloudinary(buffer, "furni_gebeya/avatars");

    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (err: any) {
    console.error("[Upload Route Error]", err);
    return NextResponse.json({ error: err.message || "Failed to process image upload" }, { status: 500 });
  }
}
