import { NextRequest, NextResponse } from "next/server";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { createAndSendOtp } from "@/lib/otp-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneInput = body?.phone;

    if (!phoneInput) {
      return NextResponse.json(
        { error: "Phone number is required." },
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

    const result = await createAndSendOtp(validation.normalized);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      normalizedPhone: validation.normalized,
      operator: validation.operator,
      cooldownSeconds: result.cooldownSeconds,
    });
  } catch (err: any) {
    console.error("[Send OTP API Error]", err);
    return NextResponse.json(
      { error: "Internal server error while sending verification code." },
      { status: 500 }
    );
  }
}
