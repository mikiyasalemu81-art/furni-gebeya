import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/afromessage";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_CODES_PER_PHONE_HOUR = 3;
const MAX_CODES_PER_IP_HOUR = 10;

function getOtpHashSecret(): string {
  return (
    process.env.OTP_HASH_SECRET ||
    process.env.OTP_SECRET ||
    "furni-gebeya-secure-otp-hash-secret-32-chars-key"
  );
}

/**
 * Hash code with HMAC-SHA256(code, OTP_HASH_SECRET)
 */
export function hashOtpCode(code: string): string {
  const secret = getOtpHashSecret();
  return crypto.createHmac("sha256", secret).update(code.trim()).digest("hex");
}

/**
 * Compare code hashes using crypto.timingSafeEqual
 */
export function verifyOtpHash(candidateCode: string, storedHash: string): boolean {
  try {
    const candidateHash = hashOtpCode(candidateCode);
    const candidateBuffer = Buffer.from(candidateHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate cryptographically secure 6-digit OTP with crypto.randomInt (NOT Math.random)
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * In-memory fallback tracking for fast rate limits and dev resiliency
 */
interface InMemoryOtp {
  id: string;
  phone: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  consumed_at: string | null;
  created_at: string;
  ip_address?: string | null;
}

const memoryOtps: InMemoryOtp[] = [];

/**
 * Enforce rate limits:
 * - 60s cooldown between sends for same phone
 * - max 3 codes per phone per hour
 * - max 10 requests per IP per hour
 */
export async function checkOtpRateLimits(
  phone: string,
  ipAddress?: string | null
): Promise<{ allowed: boolean; error?: string; cooldownSeconds?: number }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const cooldownWindow = new Date(now.getTime() - RESEND_COOLDOWN_MS).toISOString();

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      // 1. Check cooldown (60 seconds)
      const { data: recentList } = await admin
        .from("otp_codes")
        .select("created_at")
        .eq("phone", phone)
        .gte("created_at", cooldownWindow)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentList && recentList.length > 0) {
        const diffMs = now.getTime() - new Date(recentList[0].created_at).getTime();
        const remSecs = Math.max(1, Math.ceil((RESEND_COOLDOWN_MS - diffMs) / 1000));
        return {
          allowed: false,
          cooldownSeconds: remSecs,
          error: `Please wait ${remSecs} seconds before requesting a new code.`,
        };
      }

      // 2. Check max 3 codes per phone per hour
      const { count: phoneCount } = await admin
        .from("otp_codes")
        .select("id", { count: "exact", head: true })
        .eq("phone", phone)
        .gte("created_at", oneHourAgo);

      if ((phoneCount || 0) >= MAX_CODES_PER_PHONE_HOUR) {
        return {
          allowed: false,
          error: "Too many codes requested for this number. Maximum 3 codes per hour. Please try again later.",
        };
      }

      // 3. Check max 10 requests per IP per hour
      if (ipAddress) {
        const { count: ipCount } = await admin
          .from("otp_codes")
          .select("id", { count: "exact", head: true })
          .eq("ip_address", ipAddress)
          .gte("created_at", oneHourAgo);

        if ((ipCount || 0) >= MAX_CODES_PER_IP_HOUR) {
          return {
            allowed: false,
            error: "Too many requests from your network. Please try again after 1 hour.",
          };
        }
      }

      return { allowed: true };
    } catch (e) {
      console.warn("[Supabase rate limit query error, checking memory fallback]", e);
    }
  }

  // Memory fallback rate limits
  const phoneOtps1Hr = memoryOtps.filter(
    (o) => o.phone === phone && new Date(o.created_at) >= new Date(oneHourAgo)
  );

  const lastPhoneOtp = phoneOtps1Hr[phoneOtps1Hr.length - 1];
  if (lastPhoneOtp) {
    const diffMs = now.getTime() - new Date(lastPhoneOtp.created_at).getTime();
    if (diffMs < RESEND_COOLDOWN_MS) {
      const remSecs = Math.max(1, Math.ceil((RESEND_COOLDOWN_MS - diffMs) / 1000));
      return {
        allowed: false,
        cooldownSeconds: remSecs,
        error: `Please wait ${remSecs} seconds before requesting a new code.`,
      };
    }
  }

  if (phoneOtps1Hr.length >= MAX_CODES_PER_PHONE_HOUR) {
    return {
      allowed: false,
      error: "Too many codes requested for this number. Maximum 3 codes per hour. Please try again later.",
    };
  }

  if (ipAddress) {
    const ipOtps1Hr = memoryOtps.filter(
      (o) => o.ip_address === ipAddress && new Date(o.created_at) >= new Date(oneHourAgo)
    );
    if (ipOtps1Hr.length >= MAX_CODES_PER_IP_HOUR) {
      return {
        allowed: false,
        error: "Too many requests from your network. Please try again after 1 hour.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Generate, store in otp_codes table, and send OTP via AfroMessage
 */
export async function requestAndSendOtp(params: {
  phone: string;
  ipAddress?: string | null;
  locale?: string;
}): Promise<{ success: boolean; cooldownSeconds?: number; error?: string }> {
  // 1. Rate limits check
  const rateLimit = await checkOtpRateLimits(params.phone, params.ipAddress);
  if (!rateLimit.allowed) {
    return {
      success: false,
      cooldownSeconds: rateLimit.cooldownSeconds,
      error: rateLimit.error,
    };
  }

  // 2. Generate secure code & HMAC-SHA256
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
  const otpId = crypto.randomUUID();

  // Invalidate earlier unused code for this phone
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("otp_codes")
        .update({ consumed_at: now.toISOString() })
        .eq("phone", params.phone)
        .is("consumed_at", null);
    } catch {
      // ignore
    }
  }

  // Invalidate in memory
  for (const o of memoryOtps) {
    if (o.phone === params.phone && !o.consumed_at) {
      o.consumed_at = now.toISOString();
    }
  }

  // Insert new record
  const otpRecord: InMemoryOtp = {
    id: otpId,
    phone: params.phone,
    code_hash: codeHash,
    expires_at: expiresAt.toISOString(),
    attempts: 0,
    consumed_at: null,
    created_at: now.toISOString(),
    ip_address: params.ipAddress || null,
  };
  memoryOtps.push(otpRecord);

  if (admin) {
    try {
      await admin.from("otp_codes").insert(otpRecord);
    } catch (e) {
      console.warn("[Failed inserting into otp_codes in Supabase]", e);
    }
  }

  // In development only: print code to server console (Never log in production)
  if (process.env.NODE_ENV === "development") {
    console.log("=================================================");
    console.log(`[DEV OTP ONLY] Phone: ${params.phone}`);
    console.log(`[DEV OTP ONLY] Code:  ${code}`);
    console.log(`[DEV OTP ONLY] Expiry: 5 minutes (${expiresAt.toLocaleTimeString()})`);
    console.log("=================================================");
  }

  // Construct message in user's language (en, am, om)
  let smsText = `Furni Gebeya: your code is ${code}. It expires in 5 minutes.`;
  if (params.locale === "am") {
    smsText = `ፈርኒ ገበያ፡ የማረጋገጫ ኮድዎ ${code} ነው። በ5 ደቂቃ ውስጥ ያበቃል።`;
  } else if (params.locale === "om") {
    smsText = `Furni Gebeya: koodiin mirkaneessaa keessan ${code} dha. Daqiiqaa 5 keessatti tajaajila ala ta'a.`;
  }

  // Send via AfroMessage
  const smsResult = await sendSms({
    to: params.phone,
    message: smsText,
  });

  if (!smsResult.success) {
    // If SMS fails, delete the stored code as requested in spec
    if (admin) {
      try {
        await admin.from("otp_codes").delete().eq("id", otpId);
      } catch {
        // ignore
      }
    }
    const idx = memoryOtps.findIndex((o) => o.id === otpId);
    if (idx >= 0) memoryOtps.splice(idx, 1);

    return {
      success: false,
      error: smsResult.error || "Failed to deliver SMS. Please try again in a moment.",
    };
  }

  return {
    success: true,
    cooldownSeconds: 60,
  };
}

/**
 * Verify candidate code:
 * - Checks unconsumed, unexpired code
 * - Max 5 attempts
 * - Timing-safe hash comparison
 * - Marks consumed on success
 */
export async function verifyOtpAttempt(
  phone: string,
  candidateCode: string
): Promise<{ success: boolean; error?: string; attemptsRemaining?: number }> {
  const now = new Date();
  const admin = getSupabaseAdmin();

  // Find latest active code
  let activeOtp: InMemoryOtp | null = null;

  if (admin) {
    try {
      const { data } = await admin
        .from("otp_codes")
        .select("*")
        .eq("phone", phone)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        activeOtp = data[0] as InMemoryOtp;
      }
    } catch (e) {
      console.warn("[Failed querying active otp from Supabase]", e);
    }
  }

  if (!activeOtp) {
    // Check memory fallback
    const matching = memoryOtps
      .filter((o) => o.phone === phone && !o.consumed_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    activeOtp = matching[0] || null;
  }

  if (!activeOtp) {
    return {
      success: false,
      error: "No active verification code found for this number. Please request a new code.",
    };
  }

  // 1. Check expiration
  if (now.getTime() > new Date(activeOtp.expires_at).getTime()) {
    return {
      success: false,
      error: "The code has expired (5-minute limit). Please request a new code.",
    };
  }

  // 2. Check maximum 5 attempts
  if (activeOtp.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    // Lock it
    if (admin) {
      await admin
        .from("otp_codes")
        .update({ consumed_at: now.toISOString() })
        .eq("id", activeOtp.id);
    }
    activeOtp.consumed_at = now.toISOString();

    return {
      success: false,
      error: "Too many failed attempts. This code has been locked. Please request a new code.",
    };
  }

  // 3. Timing-safe hash verification
  const isMatch = verifyOtpHash(candidateCode, activeOtp.code_hash);

  if (!isMatch) {
    const updatedAttempts = activeOtp.attempts + 1;
    activeOtp.attempts = updatedAttempts;

    if (admin) {
      await admin
        .from("otp_codes")
        .update({ attempts: updatedAttempts })
        .eq("id", activeOtp.id);
    }

    const remaining = MAX_VERIFICATION_ATTEMPTS - updatedAttempts;
    if (remaining <= 0) {
      // Lock code
      if (admin) {
        await admin
          .from("otp_codes")
          .update({ consumed_at: now.toISOString() })
          .eq("id", activeOtp.id);
      }
      activeOtp.consumed_at = now.toISOString();

      return {
        success: false,
        error: "Too many failed attempts. Code locked. Please request a new code.",
      };
    }

    return {
      success: false,
      attemptsRemaining: remaining,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // 4. Mark code consumed
  if (admin) {
    await admin
      .from("otp_codes")
      .update({ consumed_at: now.toISOString() })
      .eq("id", activeOtp.id);
  }
  return { success: true };
}

/**
 * Backward compatibility alias for earlier modules
 */
export async function createAndSendOtp(phone: string) {
  return requestAndSendOtp({ phone });
}

export async function sendOtpViaAfroMessage(phone: string, code: string) {
  return sendSms({
    to: phone,
    message: `Your Furni Gebeya verification code is: ${code}. Valid for 5 minutes.`,
  });
}

