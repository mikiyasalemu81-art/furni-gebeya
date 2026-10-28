import { sendSmsEthiopia } from "@/lib/smsethiopia";
import { sendSms as sendAfroMessage } from "@/lib/afromessage";
import { getSmsProvider, getSmsEthiopiaApiKey, getAfroMessageToken } from "@/lib/env";
import { SmsErrorCode } from "@/lib/sms-errors";

export interface UnifiedSendSmsParams {
  to: string;
  message: string;
  locale?: string;
  otpCodeForDev?: string;
}

export interface UnifiedSendSmsResult {
  success: boolean;
  provider: "smsethiopia" | "afromessage" | "dev";
  messageId?: string;
  errorCode?: SmsErrorCode;
  error?: string;
}

/**
 * Unified SMS Dispatcher
 * Intelligently routes through SMS Ethiopia (smsethiopia.com) or AfroMessage,
 * with automatic fallback and development mode ergonomics.
 */
export async function sendUnifiedSms(
  params: UnifiedSendSmsParams
): Promise<UnifiedSendSmsResult> {
  const providerPreference = getSmsProvider();
  const hasSmsEthiopia = Boolean(getSmsEthiopiaApiKey());
  const hasAfroMessage = Boolean(getAfroMessageToken());

  // Determine priority:
  // 1. Explicitly requested 'smsethiopia'
  // 2. 'auto' mode and SMSETHIOPIA_API_KEY is present (prefer SMS Ethiopia to bypass beta contact limits)
  // 3. Or when SMS Ethiopia is configured and AfroMessage is not
  const preferSmsEthiopia =
    providerPreference === "smsethiopia" ||
    (providerPreference === "auto" && hasSmsEthiopia) ||
    (!hasAfroMessage && hasSmsEthiopia);

  if (preferSmsEthiopia) {
    const res = await sendSmsEthiopia(params);
    if (res.success) {
      return { success: true, provider: "smsethiopia", messageId: res.messageId };
    }

    // If SMS Ethiopia had an issue and AfroMessage is also configured, attempt automatic fallback
    if (hasAfroMessage && providerPreference === "auto") {
      console.warn("[SMS Gateway] SMS Ethiopia dispatch failed. Trying AfroMessage fallback...");
      const afroRes = await sendAfroMessage(params);
      if (afroRes.success) {
        return { success: true, provider: "afromessage", messageId: afroRes.messageId };
      }
    }

    return {
      success: false,
      provider: "smsethiopia",
      errorCode: res.errorCode,
      error: res.error,
    };
  }

  // Otherwise, use AfroMessage
  const afroRes = await sendAfroMessage(params);
  if (afroRes.success) {
    return { success: true, provider: "afromessage", messageId: afroRes.messageId };
  }

  // If AfroMessage fails (e.g. unverified beta contact) and SMS Ethiopia is configured, fallback to SMS Ethiopia
  if (hasSmsEthiopia && providerPreference === "auto") {
    console.warn("[SMS Gateway] AfroMessage dispatch failed. Trying SMS Ethiopia fallback...");
    const ethiopiaRes = await sendSmsEthiopia(params);
    if (ethiopiaRes.success) {
      return { success: true, provider: "smsethiopia", messageId: ethiopiaRes.messageId };
    }
  }

  return {
    success: false,
    provider: "afromessage",
    errorCode: afroRes.errorCode,
    error: afroRes.error,
  };
}
