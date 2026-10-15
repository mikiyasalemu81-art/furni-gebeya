import { NextRequest, NextResponse } from "next/server";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { requestAndSendOtp } from "@/lib/otp-service";
import { getSmsErrorMessage } from "@/lib/sms-errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phoneInput = body?.phone;
    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
    const locale = (body?.locale || cookieLocale || "en").toLowerCase();

    if (!phoneInput) {
      return NextResponse.json(
        { error: getSmsErrorMessage("invalid_phone", locale), errorCode: "invalid_phone" },
        { status: 400 }
      );
    }

    const validation = normalizeEthiopianPhone(phoneInput);
    if (!validation.isValid || !validation.normalized) {
      return NextResponse.json(
        {
          error: validation.error || getSmsErrorMessage("invalid_phone", locale),
          errorCode: "invalid_phone",
        },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip");

    const result = await requestAndSendOtp({
      phone: validation.normalized,
      ipAddress,
      locale,
    });

    if (!result.success) {
      const statusCode = result.cooldownSeconds
        ? 429
        : result.errorCode === "provider_unavailable"
        ? 503
        : 400;

      return NextResponse.json(
        {
          error: result.error,
          errorCode: result.errorCode,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      normalizedPhone: validation.normalized,
      operator: validation.operator,
      cooldownSeconds: result.cooldownSeconds,
      devCode: result.devCode,
    });
  } catch (err: any) {
    console.error("[Send OTP API Error]", err?.message || err);
    return NextResponse.json(
      { error: "Internal server error while sending verification code." },
      { status: 500 }
    );
  }
}
