import { getSmsEthiopiaApiKey } from "@/lib/env";
import { SmsErrorCode, getSmsErrorMessage } from "@/lib/sms-errors";

export interface SendSmsEthiopiaParams {
  to: string; // phone in E.164 (+251...) or national (251...)
  message: string;
  locale?: string;
  otpCodeForDev?: string;
}

export interface SendSmsEthiopiaResult {
  success: boolean;
  messageId?: string;
  errorCode?: SmsErrorCode;
  error?: string;
}

/**
 * SMS Ethiopia (smsethiopia.com) Client
 * Direct Ethio Telecom & Safaricom Ethiopia messaging gateway
 * Endpoint: POST https://smsethiopia.com/api/sms/send
 * Header: KEY: <API_KEY>
 * Payload: { msisdn: "2519XXXXXXXX", text: "..." }
 */
export async function sendSmsEthiopia({
  to,
  message,
  locale = "en",
  otpCodeForDev,
}: SendSmsEthiopiaParams): Promise<SendSmsEthiopiaResult> {
  const apiKey = getSmsEthiopiaApiKey();

  // Format to standard 12-digit Ethiopian MSISDN: 2519XXXXXXXX (no leading +)
  let msisdn = to.trim().replace(/^\+/, "");
  if (msisdn.startsWith("0")) {
    msisdn = "251" + msisdn.slice(1);
  }

  // 1. Check if key is configured
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n=======================================================");
      console.log("[SMS ETHIOPIA DEV MODE] SMSETHIOPIA_API_KEY is not configured.");
      if (otpCodeForDev) {
        console.log(`[SMS ETHIOPIA DEV MODE] Recipient: ${msisdn}`);
        console.log(`[SMS ETHIOPIA DEV MODE] 6-Digit OTP Code: >> ${otpCodeForDev} <<`);
      } else {
        console.log(`[SMS ETHIOPIA DEV MODE] Message: ${message}`);
      }
      console.log("=======================================================\n");
      return {
        success: true,
        messageId: "dev-simulated-msg-id",
      };
    }

    console.error("[SMS Ethiopia Server Error] SMSETHIOPIA_API_KEY is missing or empty.");
    return {
      success: false,
      errorCode: "sms_not_configured",
      error: getSmsErrorMessage("sms_not_configured", locale),
    };
  }

  try {
    const res = await fetch("https://smsethiopia.com/api/sms/send", {
      method: "POST",
      headers: {
        KEY: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        msisdn,
        text: message,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.status !== "success") {
      const rawError = data?.message || data?.error || `HTTP ${res.status}`;
      console.error(
        `[SMS Ethiopia Server Error] Status: ${res.status}, Provider response: ${rawError}`
      );

      let errorCode: SmsErrorCode = "provider_unavailable";
      const lower = String(rawError).toLowerCase();

      if (
        res.status === 401 ||
        res.status === 403 ||
        lower.includes("key") ||
        lower.includes("auth") ||
        lower.includes("unauthorized")
      ) {
        errorCode = "invalid_credentials";
      } else if (
        res.status === 402 ||
        lower.includes("balance") ||
        lower.includes("credit") ||
        lower.includes("insufficient")
      ) {
        errorCode = "insufficient_balance";
      } else if (
        lower.includes("msisdn") ||
        lower.includes("number") ||
        lower.includes("phone") ||
        lower.includes("format")
      ) {
        errorCode = "invalid_phone";
      } else if (res.status >= 500) {
        errorCode = "provider_unavailable";
      }

      if (process.env.NODE_ENV === "development" && otpCodeForDev) {
        console.warn(
          `[SMS Ethiopia DEV Note] Provider reported: ${rawError}. Continuing login since in development mode.`
        );
        return { success: true, messageId: "dev-fallback-id" };
      }

      return {
        success: false,
        errorCode,
        error: getSmsErrorMessage(errorCode, locale),
      };
    }

    return {
      success: true,
      messageId: data.message_id || "smsethiopia-delivered",
    };
  } catch (err: any) {
    console.error(`[SMS Ethiopia Exception] Network error: ${err?.message || "Unknown"}`);

    if (process.env.NODE_ENV === "development" && otpCodeForDev) {
      console.warn(`[SMS Ethiopia DEV Note] Network exception: ${err?.message}. Continuing login in dev mode.`);
      return { success: true, messageId: "dev-fallback-id" };
    }

    return {
      success: false,
      errorCode: "provider_unavailable",
      error: getSmsErrorMessage("provider_unavailable", locale),
    };
  }
}
