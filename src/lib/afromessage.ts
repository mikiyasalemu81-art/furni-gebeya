import {
  getAfroMessageToken,
  getAfroMessageIdentifierId,
  getAfroMessageSenderName,
} from "@/lib/env";
import { SmsErrorCode, getSmsErrorMessage } from "@/lib/sms-errors";

export interface SendSmsParams {
  to: string;
  message: string;
  sender?: string;
  from?: string;
  locale?: string;
  otpCodeForDev?: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  errorCode?: SmsErrorCode;
  error?: string;
}

/**
 * AfroMessage SMS Service
 * Spec:
 * - URL: POST https://api.afromessage.com/api/send
 * - Authorization: Bearer <TOKEN>
 * - Body: { to, message, [from], [sender] }
 * - Never logs secrets or tokens.
 * - In development mode without token, logs code to terminal and allows login to continue.
 * - In production, strictly validates and returns localized user-friendly errors.
 */
export async function sendSms({
  to,
  message,
  sender,
  from,
  locale = "en",
  otpCodeForDev,
}: SendSmsParams): Promise<SendSmsResult> {
  const token = getAfroMessageToken();
  const configuredSender = sender?.trim() || getAfroMessageSenderName();
  const configuredFrom = from?.trim() || getAfroMessageIdentifierId();

  // 1. Check if token is configured
  if (!token) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n=======================================================");
      console.log("[AFROMESSAGE DEV MODE] AfroMessage token is not configured.");
      if (otpCodeForDev) {
        console.log(`[AFROMESSAGE DEV MODE] Recipient: ${to}`);
        console.log(`[AFROMESSAGE DEV MODE] 6-Digit OTP Code: >> ${otpCodeForDev} <<`);
      } else {
        console.log(`[AFROMESSAGE DEV MODE] Message: ${message}`);
      }
      console.log("=======================================================\n");
      return {
        success: true,
        messageId: "dev-simulated-msg-id",
      };
    }

    // In production: log on server (never secrets) and return localized error
    console.error("[AfroMessage Server Error] AFROMESSAGE_API_TOKEN is missing or empty.");
    return {
      success: false,
      errorCode: "sms_not_configured",
      error: getSmsErrorMessage("sms_not_configured", locale),
    };
  }

  // 2. Build payload strictly according to AfroMessage API
  const payload: Record<string, string> = {
    to,
    message,
  };

  // Only include from if non-empty string
  if (configuredFrom && configuredFrom.length > 0) {
    payload.from = configuredFrom;
  }

  // Only include sender if explicitly provided and non-empty (never send empty field)
  if (configuredSender && configuredSender.length > 0) {
    payload.sender = configuredSender;
  }

  try {
    let res = await fetch("https://api.afromessage.com/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = await res.json().catch(() => null);

    // If custom sender id/name fails because brand sender is pending approval,
    // retry once without sender parameter (uses account default sender)
    if (
      (!res.ok || data?.acknowledge === "error") &&
      payload.sender &&
      data?.response?.errors?.[0]?.toLowerCase().includes("sender")
    ) {
      console.warn("[AfroMessage Server Warning] Sender name rejected by provider. Retrying without sender parameter.");
      delete payload.sender;

      res = await fetch("https://api.afromessage.com/api/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => null);
    }

    // Check HTTP status and JSON response body
    const rawErrorMessage =
      (Array.isArray(data?.response?.errors) && data.response.errors.join("; ")) ||
      data?.response?.message ||
      data?.message ||
      "";

    // Server log: status code and provider message (NEVER token or code)
    if (!res.ok || data?.acknowledge !== "success") {
      console.error(
        `[AfroMessage Server Error] Status: ${res.status}, Provider response: ${rawErrorMessage || "No error details returned"}`
      );
    }

    // Classify error into user-friendly localized error code
    if (!res.ok || !data || data.acknowledge !== "success") {
      let errorCode: SmsErrorCode = "provider_unavailable";
      const lower = rawErrorMessage.toLowerCase();

      if (
        lower.includes("unverified contact") ||
        lower.includes("beta testing") ||
        lower.includes("verify your contacts") ||
        lower.includes("verify this contact")
      ) {
        errorCode = "unverified_beta_contact";
      } else if (
        res.status === 401 ||
        res.status === 403 ||
        lower.includes("unauthorized") ||
        lower.includes("token") ||
        lower.includes("credential")
      ) {
        errorCode = "invalid_credentials";
      } else if (
        res.status === 402 ||
        lower.includes("balance") ||
        lower.includes("insufficient") ||
        lower.includes("credit")
      ) {
        errorCode = "insufficient_balance";
      } else if (
        lower.includes("invalid phone") ||
        lower.includes("invalid recipient") ||
        lower.includes("invalid to") ||
        lower.includes("phone number")
      ) {
        errorCode = "invalid_phone";
      } else if (res.status >= 500) {
        errorCode = "provider_unavailable";
      }

      // In development mode, allow developers to proceed while warning in logs
      if (process.env.NODE_ENV === "development" && otpCodeForDev) {
        console.warn(`[AfroMessage DEV Note] Provider reported: ${rawErrorMessage}. Continuing login since in development mode.`);
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
      messageId: data.response?.message_id,
    };
  } catch (err: any) {
    console.error(`[AfroMessage Server Exception] Network or fetch error: ${err?.message || "Unknown error"}`);

    if (process.env.NODE_ENV === "development" && otpCodeForDev) {
      console.warn(`[AfroMessage DEV Note] Network exception: ${err?.message}. Continuing login in dev mode.`);
      return { success: true, messageId: "dev-fallback-id" };
    }

    return {
      success: false,
      errorCode: "provider_unavailable",
      error: getSmsErrorMessage("provider_unavailable", locale),
    };
  }
}
