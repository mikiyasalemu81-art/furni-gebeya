export interface SendSmsParams {
  to: string;
  message: string;
  sender?: string;
  from?: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * AfroMessage API Integration (Single server-only module)
 * Uses official POST https://api.afromessage.com/api/send
 * Request body: { to, message, sender, from }
 * Response body: { acknowledge: 'success' | 'error', response: { message_id, errors, ... } }
 */
export async function sendSms({
  to,
  message,
  sender,
  from,
}: SendSmsParams): Promise<SendSmsResult> {
  const token = process.env.AFROMESSAGE_API_TOKEN;
  const configuredSender = sender || process.env.AFROMESSAGE_SENDER_NAME || "FurniGebeya";
  const configuredFrom = from || process.env.AFROMESSAGE_IDENTIFIER_ID || undefined;

  // In development, print to console when NODE_ENV is development
  if (process.env.NODE_ENV === "development") {
    console.log("=================================================");
    console.log(`[AfroMessage DEV SMS] To: ${to}`);
    console.log(`[AfroMessage DEV SMS] Sender: ${configuredSender}`);
    console.log(`[AfroMessage DEV SMS] Message: ${message}`);
    console.log("=================================================");
  }

  // If no API token provided, allow dev mode simulation
  if (!token) {
    if (process.env.NODE_ENV === "development") {
      return { success: true, messageId: "dev-simulated-msg-id" };
    }
    return {
      success: false,
      error: "AfroMessage API token is not configured on the server.",
    };
  }

  try {
    const payload: Record<string, any> = {
      to,
      message,
    };
    if (configuredSender) payload.sender = configuredSender;
    if (configuredFrom) payload.from = configuredFrom;

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

    // If custom sender id/name fails because brand sender is pending approval, retry without sender parameter (uses account default)
    if (
      (!res.ok || data?.acknowledge === "error") &&
      payload.sender &&
      data?.response?.errors?.[0]?.includes("sender id/name")
    ) {
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

    if (!res.ok || !data) {
      const errMsg =
        data?.response?.errors?.[0] ||
        data?.message ||
        `AfroMessage HTTP error: ${res.status}`;
      // In development, console OTP was already printed, so allow testing even if SMS provider quota/unapproved sender fails
      if (process.env.NODE_ENV === "development") {
        console.warn(`[AfroMessage DEV Note]: ${errMsg} (Continuing in dev mode as OTP was printed to console).`);
        return { success: true, messageId: "dev-fallback-id" };
      }
      return { success: false, error: errMsg };
    }

    if (data.acknowledge === "success") {
      return {
        success: true,
        messageId: data.response?.message_id,
      };
    } else {
      const err =
        Array.isArray(data.response?.errors) && data.response.errors.length > 0
          ? data.response.errors.join(", ")
          : "AfroMessage returned an error.";
      if (process.env.NODE_ENV === "development") {
        console.warn(`[AfroMessage DEV Note]: ${err} (Continuing in dev mode as OTP was printed to console).`);
        return { success: true, messageId: "dev-fallback-id" };
      }
      return { success: false, error: err };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network exception sending SMS via AfroMessage.",
    };
  }
}
