import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getOtpHashSecret } from "@/lib/env";

const localVoiceStore = new Map<string, { buffer: Buffer; mimeType: string }>();

/**
 * Upload voice note to private "voice-notes" bucket (never public)
 */
export async function uploadPrivateVoiceNote(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  extension = "webm"
): Promise<{ success: boolean; path?: string; error?: string }> {
  const filename = `${userId}/voice_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${extension}`;

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.storage
        .from("voice-notes")
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!error && data?.path) {
        return { success: true, path: data.path };
      }
    } catch (e: any) {
      console.warn("[Voice upload to Supabase storage exception]", e.message);
    }
  }

  // Fallback to local memory store for local development
  localVoiceStore.set(filename, { buffer, mimeType });
  return { success: true, path: filename };
}

/**
 * Generate a short-lived signed URL for a private voice message (1 hour)
 */
export async function createSignedVoiceUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.storage
        .from("voice-notes")
        .createSignedUrl(storagePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (e) {
      console.warn("[Failed to generate voice signed URL from Supabase]", e);
    }
  }

  // Secure tokenized dev route
  const secret = getOtpHashSecret();
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const token = crypto
    .createHmac("sha256", secret)
    .update(`${storagePath}:${expiresAt}`)
    .digest("hex");

  return `/api/chat/voice-stream?path=${encodeURIComponent(
    storagePath
  )}&expires=${expiresAt}&token=${token}`;
}

export function getLocalVoiceFile(storagePath: string) {
  return localVoiceStore.get(storagePath);
}

export function validateVoiceSignedToken(
  storagePath: string,
  expires: string,
  token: string
): boolean {
  if (Date.now() > Number(expires)) {
    return false;
  }
  const secret = getOtpHashSecret();
  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(`${storagePath}:${expires}`)
    .digest("hex");

  return token === expectedToken;
}

