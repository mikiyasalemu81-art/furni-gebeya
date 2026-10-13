import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { requestAndSendOtp } from "@/lib/otp-service";

const requestOtpSchema = z.object({
  phone: z.string().min(1, "Phone number is required."),
  locale: z.enum(["en", "am", "om"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = requestOtpSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { phone: rawPhone, locale } = parsed.data;

    // 1. Normalize Ethiopian phone number
    const validation = normalizeEthiopianPhone(rawPhone);
    if (!validation.isValid || !validation.normalized) {
      return NextResponse.json(
        { error: validation.error || "Invalid Ethiopian phone number." },
        { status: 400 }
      );
    }

    // Extract client IP address for IP rate limiting (max 10 / hr)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    // 2. Rate limit check, code generation, hashing & AfroMessage SMS
    const result = await requestAndSendOtp({
      phone: validation.normalized,
      ipAddress,
      locale: locale || "en",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: result.cooldownSeconds ? 429 : 500 }
      );
    }

    // Return uniform generic response
    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully.",
      cooldownSeconds: result.cooldownSeconds || 60,
      normalizedPhone: validation.normalized,
    });
  } catch (err: any) {
    console.error("[Request OTP Route Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
