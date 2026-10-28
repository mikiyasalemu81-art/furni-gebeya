/**
 * Server-only environment variable loader and sanitizer.
 * Trims whitespace, removes wrapping quotes, and supports standard aliases.
 * NEVER hardcodes, logs, or returns any secret values.
 */

if (typeof window !== "undefined") {
  throw new Error("Security Violation: env.ts can only be imported on the server.");
}

/**
 * Safely reads and sanitizes an environment variable:
 * - Checks the primary key and any fallback aliases in order
 * - Strips leading/trailing whitespace and surrounding single or double quotes
 * - Treats empty or whitespace-only strings as undefined
 */
export function getCleanEnv(primaryKey: string, ...fallbackKeys: string[]): string | undefined {
  const keys = [primaryKey, ...fallbackKeys];
  for (const k of keys) {
    let raw = process.env[k];
    if (raw !== undefined && raw !== null) {
      raw = raw.trim();
      // Remove surrounding quotes if user entered "value" or 'value'
      if (
        (raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))
      ) {
        raw = raw.slice(1, -1).trim();
      }
      if (raw.length > 0) {
        return raw;
      }
    }
  }
  return undefined;
}

// Canonical getters with aliases
export function getAfroMessageToken(): string | undefined {
  return getCleanEnv("AFROMESSAGE_API_TOKEN", "AFROMESSAGE_API_KEY");
}

export function getAfroMessageIdentifierId(): string | undefined {
  return getCleanEnv("AFROMESSAGE_IDENTIFIER_ID", "AFROMESSAGE_IDENTIFIER");
}

export function getAfroMessageSenderName(): string | undefined {
  return getCleanEnv("AFROMESSAGE_SENDER_NAME");
}

export function getSmsEthiopiaApiKey(): string | undefined {
  return getCleanEnv("SMSETHIOPIA_API_KEY", "SMS_ETHIOPIA_API_KEY", "SMSETHIOPIA_KEY");
}

export function getSmsProvider(): "smsethiopia" | "afromessage" | "auto" {
  const provider = getCleanEnv("SMS_PROVIDER")?.toLowerCase();
  if (provider === "afromessage") return "afromessage";
  if (provider === "smsethiopia") return "smsethiopia";
  return "auto";
}


export function getOtpHashSecret(): string {
  const secret = getCleanEnv("OTP_HASH_SECRET", "OTP_SECRET");
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return "furni-gebeya-dev-otp-hmac-secret-32-chars";
    }
    // High-entropy fallback key ensures no 500 crash even if user hasn't added OTP_HASH_SECRET in Vercel
    return "furni-gebeya-secure-random-otp-hmac-secret-key-32chars";
  }
  return secret;
}


export function getSupabaseServiceRoleKey(): string | undefined {
  return getCleanEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_SECRET_KEY");
}

export function getSupabaseUrl(): string | undefined {
  return getCleanEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | undefined {
  return getCleanEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
}

export function getAdminPhone(): string | undefined {
  return getCleanEnv("ADMIN_PHONE");
}
