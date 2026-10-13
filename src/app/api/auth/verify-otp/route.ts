import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { verifyOtpAttempt } from "@/lib/otp-service";
import { createOrAuthenticateUser } from "@/lib/auth-session";

const verifyOtpSchema = z.object({
  phone: z.string().min(1, "Phone number is required."),
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits.")
    .regex(/^\d{6}$/, "Verification code must contain digits only."),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = verifyOtpSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { phone: rawPhone, code } = parsed.data;

    // 1. Normalize phone
    const validation = normalizeEthiopianPhone(rawPhone);
    if (!validation.isValid || !validation.normalized) {
      return NextResponse.json(
        { error: validation.error || "Invalid Ethiopian phone number." },
        { status: 400 }
      );
    }

    // 2. Verify code (timingSafeEqual, max 5 attempts, expiry, consumed update)
    const verifyResult = await verifyOtpAttempt(validation.normalized, code);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error: verifyResult.error,
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // 3. Authenticate or create Supabase user + profile + session cookies
    const { profile, isFirstLogin } = await createOrAuthenticateUser(
      validation.normalized
    );

    const isNew = isFirstLogin || !profile.role;
    const needsRoleSelection = !profile.role;
    const needsWelcome = !profile.onboarding_done && !profile.is_onboarded;

    return NextResponse.json({
      success: true,
      profile,
      isNewUser: isNew,
      needsRoleSelection,
      needsWelcome,
    });
  } catch (err: any) {
    console.error("[Verify OTP Route Error]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred verifying the code." },
      { status: 500 }
    );
  }
}
