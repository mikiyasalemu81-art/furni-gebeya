import crypto from "node:crypto";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;

// Memory storage for fast lookups and local/mock dev resilience
interface StoredOtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  requestCount1Hour: number;
  firstRequestInHour: number;
}

const memoryOtpStore = new Map<string, StoredOtpRecord>();

function getOtpSecret(): string {
  return process.env.OTP_SECRET || "furni-gebeya-default-dev-secret-32-chars-key";
}

/**
 * Hash code with HMAC-SHA256
 */
export function hashOtpCode(code: string): string {
  const secret = getOtpSecret();
  return crypto.createHmac("sha256", secret).update(code.trim()).digest("hex");
}

/**
 * Timing-safe hash comparison
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
 * Generates a secure cryptographic 6-digit OTP code
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * AfroMessage SMS sender with safe development mode
 */
export async function sendOtpViaAfroMessage(
  phone: string,
  code: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isDev = process.env.NODE_ENV === "development";
  const apiToken = process.env.AFROMESSAGE_API_TOKEN;
  const senderName = process.env.AFROMESSAGE_SENDER_NAME || "FurniGebeya";

  // Safe Dev Mode: Log to server console ONLY when NODE_ENV is development
  if (isDev) {
    console.log("\n=======================================================");
    console.log(`[DEV OTP] Phone: ${phone}`);
    console.log(`[DEV OTP] Code:  ${code}`);
    console.log(`[DEV OTP] Expiry: 5 minutes (${new Date(Date.now() + OTP_EXPIRY_MS).toLocaleTimeString()})`);
    console.log("=======================================================\n");
  }

  // If token is missing, fail safely or continue in dev mode
  if (!apiToken) {
    if (isDev) {
      return { success: true, messageId: "dev-simulated-id" };
    }
    return {
      success: false,
      error: "AfroMessage SMS service is not configured (missing AFROMESSAGE_API_TOKEN).",
    };
  }

  try {
    const message = `Your Furni Gebeya verification code is: ${code}. Valid for 5 minutes. Do not share this with anyone.`;

    const response = await fetch("https://api.afromessage.com/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message,
        sender: senderName,
        callback: "",
      }),
    });

    const data = await response.json();

    if (!response.ok || (data && data.acknowledge === "error")) {
      const errorMsg = data?.response?.errors?.[0] || data?.message || "AfroMessage API error";
      console.error("[AfroMessage Error]", errorMsg);
      // In development mode, don't break the user flow if AfroMessage quota/credentials fail
      if (isDev) {
        return { success: true, messageId: "dev-fallback-id" };
      }
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      messageId: data?.response?.id || "afromessage-success",
    };
  } catch (err: any) {
    console.error("[AfroMessage Network Error]", err.message);
    if (isDev) {
      return { success: true, messageId: "dev-network-fallback-id" };
    }
    return { success: false, error: "Failed to connect to SMS delivery network." };
  }
}

/**
 * Creates and stores an OTP record with rate limiting & cooldown
 */
export async function createAndSendOtp(phone: string): Promise<{
  success: boolean;
  cooldownSeconds?: number;
  error?: string;
  devCode?: string; // only populated in development
}> {
  const now = Date.now();
  const existing = memoryOtpStore.get(phone);

  // 1. Check Resend Cooldown (60s)
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
    );
    return {
      success: false,
      cooldownSeconds: remainingSeconds,
      error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
    };
  }

  // 2. Rate Limiting: Max 5 requests per hour per phone
  if (existing) {
    const oneHour = 60 * 60 * 1000;
    if (now - existing.firstRequestInHour > oneHour) {
      // Reset window
      existing.requestCount1Hour = 1;
      existing.firstRequestInHour = now;
    } else {
      existing.requestCount1Hour += 1;
      if (existing.requestCount1Hour > 5) {
        return {
          success: false,
          error: "Too many verification requests. Please try again after 1 hour.",
        };
      }
    }
  }

  // 3. Generate Code & Hash
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = now + OTP_EXPIRY_MS;

  // 4. Update Store
  memoryOtpStore.set(phone, {
    codeHash,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    requestCount1Hour: existing ? existing.requestCount1Hour : 1,
    firstRequestInHour: existing ? existing.firstRequestInHour : now,
  });

  // 5. Send via AfroMessage
  const sendResult = await sendOtpViaAfroMessage(phone, code);
  if (!sendResult.success) {
    return { success: false, error: sendResult.error };
  }

  const isDev = process.env.NODE_ENV === "development";

  return {
    success: true,
    cooldownSeconds: 60,
    devCode: isDev ? code : undefined,
  };
}

/**
 * Verifies code against stored hash with attempt limits and expiry
 */
export async function verifyOtpCode(
  phone: string,
  candidateCode: string
): Promise<{
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}> {
  const now = Date.now();
  const record = memoryOtpStore.get(phone);

  if (!record) {
    return {
      success: false,
      error: "No active verification code found for this number. Please request a code.",
    };
  }

  // 1. Check Expiry (5 minutes)
  if (now > record.expiresAt) {
    memoryOtpStore.delete(phone);
    return {
      success: false,
      error: "The verification code has expired (5-minute limit). Please request a new code.",
    };
  }

  // 2. Check Attempt Limits
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    memoryOtpStore.delete(phone);
    return {
      success: false,
      error: "Too many failed attempts. For your security, please request a new code.",
    };
  }

  // 3. Verify Code Hash
  const isValid = verifyOtpHash(candidateCode, record.codeHash);

  if (!isValid) {
    record.attempts += 1;
    const remaining = MAX_VERIFICATION_ATTEMPTS - record.attempts;

    if (remaining <= 0) {
      memoryOtpStore.delete(phone);
      return {
        success: false,
        error: "Too many incorrect attempts. Please request a new code.",
      };
    }

    return {
      success: false,
      attemptsRemaining: remaining,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Code verified! Remove code from store so it cannot be reused (one-time use)
  memoryOtpStore.delete(phone);

  return { success: true };
}
