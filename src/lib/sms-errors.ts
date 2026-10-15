/**
 * SMS & OTP Error Handling & Multi-language (en, am, om) Mapping
 * Ensures clear, user-friendly, translated feedback across Furni Gebeya.
 * NEVER leaks credentials or raw tokens.
 */

export type SmsErrorCode =
  | "sms_not_configured"
  | "invalid_credentials"
  | "insufficient_balance"
  | "invalid_phone"
  | "provider_unavailable";

export const SMS_ERROR_TRANSLATIONS: Record<string, Record<SmsErrorCode, string>> = {
  en: {
    sms_not_configured: "SMS service is not configured on the server. Please contact support.",
    invalid_credentials: "SMS service authentication failed. Please contact the administrator.",
    insufficient_balance: "SMS service balance is depleted. Please try again later.",
    invalid_phone: "Invalid phone number. Please enter a valid Ethiopian phone number.",
    provider_unavailable: "SMS service is temporarily unavailable. Please try again in a few moments.",
  },
  am: {
    sms_not_configured: "የኤስኤምኤስ (SMS) አገልግሎት በሰርቨሩ ላይ አልተዋቀረም። እባክዎ አስተዳዳሪውን ያነጋግሩ።",
    invalid_credentials: "የኤስኤምኤስ አገልግሎት ማረጋገጫ አልተሳካም። እባክዎ አስተዳዳሪውን ያነጋግሩ።",
    insufficient_balance: "የኤስኤምኤስ ሂሳብ በቂ ባለመሆኑ የማረጋገጫ ኮድ መላክ አልተቻለም። እባክዎ ቆየት ብለው ይሞክሩ።",
    invalid_phone: "የስልክ ቁጥሩ ትክክል አይደለም። እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ።",
    provider_unavailable: "የኤስኤምኤስ አገልግሎት ለጊዜው አይሰራም። እባክዎ ከጥቂት ደቂቃዎች በኋላ እንደገና ይሞክሩ።",
  },
  om: {
    sms_not_configured: "Tajaajilli SMS sarvarii irratti hin qophoofne. Maaloo bulchaa qunnamaa.",
    invalid_credentials: "Eenyummaa tajaajila SMS mirkaneessuun hin danda'amne. Maaloo bulchaa qunnamaa.",
    insufficient_balance: "Tajaajila SMS irratti herregni gahaan hin jiru. Maaloo yeroo biraa yaalaa.",
    invalid_phone: "Lakkoofsi bilbilaa sirrii miti. Maaloo lakkoofsa bilbilaa Itoophiyaa sirrii galchaa.",
    provider_unavailable: "Tajaajilli SMS yeroof addaan citeera. Maaloo daqiiqaa muraasa booda irra deebi'aa yaalaa.",
  },
};

/**
 * Returns a localized human-friendly error string for a given error code.
 */
export function getSmsErrorMessage(code: SmsErrorCode, locale: string = "en"): string {
  const normalizedLocale = locale === "am" || locale === "om" ? locale : "en";
  return (
    SMS_ERROR_TRANSLATIONS[normalizedLocale]?.[code] ||
    SMS_ERROR_TRANSLATIONS.en[code] ||
    "An error occurred while sending SMS."
  );
}
