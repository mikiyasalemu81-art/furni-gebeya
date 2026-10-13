import { NextRequest, NextResponse } from "next/server";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { verifyOtpCode } from "@/lib/otp-service";
import { createOrAuthenticateUser } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneInput = body?.phone;
    const code = body?.code;

    if (!phoneInput || !code) {
      return NextResponse.json(
        { error: "Phone number and 6-digit code are both required." },
        { status: 400 }
      );
    }

    const validation = normalizeEthiopianPhone(phoneInput);
    if (!validation.isValid || !validation.normalized) {
      return NextResponse.json(
        { error: validation.error || "Invalid Ethiopian phone number." },
        { status: 400 }
      );
    }

    // 1. Verify OTP with hash comparison, expiry check, and attempt limits
    const verifyResult = await verifyOtpCode(validation.normalized, code);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error: verifyResult.error,
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // 2. Establish server-side user session in Supabase & cookies
    const { profile, isFirstLogin } = await createOrAuthenticateUser(
      validation.normalized
    );

    return NextResponse.json({
      success: true,
      profile,
      isFirstLogin,
    });
  } catch (err: any) {
    console.error("[Verify OTP API Error]", err);
    return NextResponse.json(
      { error: "An error occurred while verifying the code." },
      { status: 500 }
    );
  }
}
