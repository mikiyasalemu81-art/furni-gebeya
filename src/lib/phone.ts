/**
 * Utilities for normalizing and validating Ethiopian phone numbers
 * Supports Ethio Telecom (09...) and Safaricom Ethiopia (07...)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // Standard E.164: +2519XXXXXXXX or +2517XXXXXXXX
  operator?: "Ethio Telecom" | "Safaricom Ethiopia";
  error?: string;
}

export function normalizeEthiopianPhone(input: string): PhoneValidationResult {
  if (!input) {
    return { isValid: false, error: "Phone number is required." };
  }

  // Remove spaces, dashes, parentheses, dots
  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, "");

  // If starts with 00251, replace with +251
  if (cleaned.startsWith("00251")) {
    cleaned = "+251" + cleaned.slice(5);
  }

  // If starts with 251 (without +), prepend +
  if (cleaned.startsWith("251") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  // If starts with 09 or 07, replace leading 0 with +251
  if (/^0[79]\d{8}$/.test(cleaned)) {
    cleaned = "+251" + cleaned.slice(1);
  }

  // If starts with 9 or 7 directly (9 digits)
  if (/^[79]\d{8}$/.test(cleaned)) {
    cleaned = "+251" + cleaned;
  }

  // Now validate canonical Ethiopian format: +251 followed by 9 or 7 and 8 digits (13 chars total)
  const ethiopianRegex = /^\+251(9\d{8}|7\d{8})$/;

  if (!ethiopianRegex.test(cleaned)) {
    return {
      isValid: false,
      error:
        "Please enter a valid Ethiopian phone number (e.g., 0911223344 or 0712345678).",
    };
  }

  const prefix = cleaned.slice(4, 5);
  const operator = prefix === "9" ? "Ethio Telecom" : "Safaricom Ethiopia";

  return {
    isValid: true,
    normalized: cleaned,
    operator,
  };
}

export function formatDisplayPhone(e164: string): string {
  if (!e164.startsWith("+251") || e164.length !== 13) {
    return e164;
  }
  // Convert +251911223344 -> +251 91 122 3344
  return `${e164.slice(0, 4)} ${e164.slice(4, 6)} ${e164.slice(6, 9)} ${e164.slice(9)}`;
}
