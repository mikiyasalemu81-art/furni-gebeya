import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  getAfroMessageToken,
  getAfroMessageIdentifierId,
  getAfroMessageSenderName,
  getOtpHashSecret,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getAdminPhone,
  getCleanEnv,
} from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Admin-only SMS Health Check Endpoint
 * GET /api/health/sms
 *
 * Verifies environment variable presence ("set" or "missing") without revealing values.
 * Performs a harmless credential verification call to AfroMessage balance endpoint
 * (no actual SMS is sent).
 */
export async function GET(req: NextRequest) {
  // 1. Authorize: Session must be admin or header match CRON_SECRET / OTP_SECRET
  const user = await getCurrentUserProfile();
  const adminPhone = getAdminPhone();
  const isAdminBySession =
    user && (user.role === "admin" || (adminPhone && user.phone_number === adminPhone));

  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const adminSecretHeader = req.headers.get("x-admin-secret");
  const cronSecret = getCleanEnv("CRON_SECRET");
  const otpSecret = getCleanEnv("OTP_HASH_SECRET", "OTP_SECRET");

  const isAdminBySecret = Boolean(
    (cronSecret && (authHeader === cronSecret || adminSecretHeader === cronSecret)) ||
    (otpSecret && (authHeader === otpSecret || adminSecretHeader === otpSecret))
  );

  if (!isAdminBySession && !isAdminBySecret) {
    return NextResponse.json(
      { error: "Unauthorized. Admin privileges or valid admin secret required." },
      { status: 401 }
    );
  }

  // 2. Audit OTP and SMS Flow Environment Variables
  const envAudit = {
    AFROMESSAGE_API_TOKEN: getAfroMessageToken() ? "set" : "missing",
    AFROMESSAGE_IDENTIFIER_ID: getAfroMessageIdentifierId() ? "set" : "missing",
    AFROMESSAGE_SENDER_NAME: getAfroMessageSenderName() ? "set" : "missing",
    OTP_HASH_SECRET: getCleanEnv("OTP_HASH_SECRET", "OTP_SECRET") ? "set" : "missing",
    SUPABASE_SERVICE_ROLE_KEY: getSupabaseServiceRoleKey() ? "set" : "missing",
    NEXT_PUBLIC_SUPABASE_URL: getSupabaseUrl() ? "set" : "missing",
    ADMIN_PHONE: getAdminPhone() ? "set" : "missing",
  };

  // 3. Harmless AfroMessage Credential Verification
  const token = getAfroMessageToken();
  let credentialsStatus: {
    tested: boolean;
    accepted: boolean;
    httpStatus?: number;
    message?: string;
  } = {
    tested: false,
    accepted: false,
    message: "Skipped: AFROMESSAGE_API_TOKEN is missing",
  };

  if (token) {
    try {
      const res = await fetch("https://api.afromessage.com/api/balance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.acknowledge === "success") {
        credentialsStatus = {
          tested: true,
          accepted: true,
          httpStatus: res.status,
          message: "AfroMessage credentials accepted successfully.",
        };
      } else {
        const errMsg =
          (Array.isArray(data?.response?.errors) && data.response.errors.join("; ")) ||
          data?.message ||
          `Provider returned status ${res.status}`;
        credentialsStatus = {
          tested: true,
          accepted: false,
          httpStatus: res.status,
          message: `AfroMessage rejected credentials: ${errMsg}`,
        };
      }
    } catch (err: any) {
      credentialsStatus = {
        tested: true,
        accepted: false,
        message: `Network error connecting to AfroMessage API: ${err?.message || "Unknown error"}`,
      };
    }
  }

  const allRequiredSet =
    envAudit.AFROMESSAGE_API_TOKEN === "set" &&
    envAudit.OTP_HASH_SECRET === "set" &&
    envAudit.SUPABASE_SERVICE_ROLE_KEY === "set" &&
    envAudit.NEXT_PUBLIC_SUPABASE_URL === "set" &&
    envAudit.ADMIN_PHONE === "set";

  return NextResponse.json({
    status: allRequiredSet && credentialsStatus.accepted ? "healthy" : "warning",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variables: envAudit,
    afroMessage: credentialsStatus,
  });
}
