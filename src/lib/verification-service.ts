import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  UserProfile,
  VerificationStatus,
  updateUserVerificationStatus,
  memoryProfiles,
} from "@/lib/auth-session";
import { sendOtpViaAfroMessage } from "@/lib/otp-service";

export interface VerificationRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_role: string;
  business_name: string;
  city: string;
  address: string;
  id_front_path: string;
  id_back_path: string;
  trade_license_path: string;
  status: VerificationStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  target_user_id: string;
  target_phone: string;
  action: "approve_verification" | "reject_verification" | "request_more_documents";
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// In-memory stores for dev resilience and fast local testing
const memoryVerifications = new Map<string, VerificationRequest>();
const memoryAuditLogs: AdminAuditLog[] = [];
const localDocumentStore = new Map<string, { buffer: Buffer; mimeType: string }>();

// Seed a sample pending verification in development for instant review testing
const samplePendingId = "v0000000-0000-0000-0000-000000000001";
memoryVerifications.set(samplePendingId, {
  id: samplePendingId,
  user_id: "u-sample-artisan-01",
  user_name: "Tadesse Wanza Woodcraft",
  user_phone: "+251912345678",
  user_role: "supplier",
  business_name: "Tadesse & Sons Custom Carpentry",
  city: "Addis Ababa",
  address: "Merkato Berbere Ber, Block 14, Addis Ababa",
  id_front_path: "mock/tadesse_id_front.jpg",
  id_back_path: "mock/tadesse_id_back.jpg",
  trade_license_path: "mock/tadesse_trade_license.pdf",
  status: "pending",
  created_at: new Date(Date.now() - 3600000).toISOString(),
});

/**
 * Uploads a document to the PRIVATE Supabase Storage bucket 'verifications'
 */
export async function uploadPrivateVerificationDocument(
  userId: string,
  docType: "id_front" | "id_back" | "trade_license",
  buffer: Buffer,
  mimeType: string,
  originalFilename: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const ext = originalFilename.split(".").pop() || "jpg";
  const filename = `${userId}/${docType}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;

  // 1. Supabase Storage upload
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.storage
        .from("verifications")
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!error && data?.path) {
        return { success: true, path: data.path };
      }
      console.warn("[Supabase Storage upload warning, falling back to local]", error);
    } catch (e: any) {
      console.warn("[Supabase Storage upload exception]", e.message);
    }
  }

  // 2. Dev Mock Store
  localDocumentStore.set(filename, { buffer, mimeType });
  return { success: true, path: filename };
}

/**
 * Generates a short-lived signed URL for a private document (e.g. 10 minutes)
 */
export async function createSignedDocumentUrl(
  storagePath: string,
  expiresInSeconds = 600
): Promise<string> {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.storage
        .from("verifications")
        .createSignedUrl(storagePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (e) {
      console.warn("[Failed to generate Supabase signed URL]", e);
    }
  }

  // Secure tokenized dev route
  const secret = process.env.OTP_SECRET || "furni-signed-url-secret";
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const token = crypto
    .createHmac("sha256", secret)
    .update(`${storagePath}:${expiresAt}`)
    .digest("hex");

  return `/api/admin/document-view?path=${encodeURIComponent(
    storagePath
  )}&expires=${expiresAt}&token=${token}`;
}

/**
 * Validates a signed URL token for document viewing
 */
export function verifySignedDocumentToken(
  storagePath: string,
  expires: number,
  token: string
): boolean {
  if (Date.now() > expires) return false;
  const secret = process.env.OTP_SECRET || "furni-signed-url-secret";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${storagePath}:${expires}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Retrieves the document buffer from the local store (dev mode)
 */
export function getLocalDocument(path: string) {
  return localDocumentStore.get(path);
}

/**
 * Submits a new verification request
 */
export async function submitVerificationRequest(
  user: UserProfile,
  data: {
    business_name: string;
    city: string;
    address: string;
    id_front_path: string;
    id_back_path: string;
    trade_license_path: string;
  }
): Promise<VerificationRequest> {
  const requestId = crypto.randomUUID();
  const request: VerificationRequest = {
    id: requestId,
    user_id: user.id,
    user_name: user.full_name,
    user_phone: user.phone_number,
    user_role: user.role || "seller",
    business_name: data.business_name,
    city: data.city,
    address: data.address,
    id_front_path: data.id_front_path,
    id_back_path: data.id_back_path,
    trade_license_path: data.trade_license_path,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  memoryVerifications.set(requestId, request);
  await updateUserVerificationStatus(user.id, "pending", false);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("verification_requests").insert({
        id: requestId,
        user_id: user.id,
        business_name: data.business_name,
        city: data.city,
        address: data.address,
        id_front_path: data.id_front_path,
        id_back_path: data.id_back_path,
        trade_license_path: data.trade_license_path,
        status: "pending",
      });
    } catch (e) {
      console.error("[Failed to insert verification in Supabase]", e);
    }
  }

  return request;
}

/**
 * Retrieves all verification requests (Admin Queue)
 */
export async function getVerificationQueue(
  statusFilter?: string
): Promise<VerificationRequest[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      let query = admin
        .from("verification_requests")
        .select(`
          *,
          profiles:user_id (full_name, phone_number, role)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          user_name: item.profiles?.full_name || "Applicant",
          user_phone: item.profiles?.phone_number || "",
          user_role: item.profiles?.role || "supplier",
          business_name: item.business_name,
          city: item.city,
          address: item.address,
          id_front_path: item.id_front_path,
          id_back_path: item.id_back_path,
          trade_license_path: item.trade_license_path,
          status: item.status,
          rejection_reason: item.rejection_reason,
          reviewed_by: item.reviewed_by,
          reviewed_at: item.reviewed_at,
          created_at: item.created_at,
        }));
      }
    } catch (e) {
      console.warn("[Supabase queue fetch error, falling back to memory]", e);
    }
  }

  const list = Array.from(memoryVerifications.values());
  if (statusFilter && statusFilter !== "all") {
    return list.filter((r) => r.status === statusFilter);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Admin action: Approve verification request
 */
export async function approveVerification(
  adminUser: UserProfile,
  requestId: string,
  docType: "all" | "id" | "license" = "all"
): Promise<{ success: boolean; error?: string }> {
  let req = memoryVerifications.get(requestId);
  const now = new Date().toISOString();

  if (req) {
    req.status = "approved";
    req.reviewed_by = adminUser.id;
    req.reviewed_at = now;
    memoryVerifications.set(requestId, req);
  }

  const admin = getSupabaseAdmin();
  let targetUserId = req?.user_id;
  let targetPhone = req?.user_phone;

  if (admin) {
    try {
      const { data } = await admin
        .from("verification_requests")
        .update({
          status: "approved",
          reviewed_by: adminUser.id,
          reviewed_at: now,
          rejection_reason: null,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (data) {
        targetUserId = data.user_id;
      }
    } catch (e) {
      console.error("[Supabase approve error]", e);
    }
  }

  if (targetUserId) {
    await updateUserVerificationStatus(targetUserId, "approved", true, docType);
  }

  // 1. Log Admin Action
  const log: AdminAuditLog = {
    id: crypto.randomUUID(),
    admin_id: adminUser.id,
    admin_name: adminUser.full_name,
    target_user_id: targetUserId || "unknown",
    target_phone: targetPhone || "",
    action: "approve_verification",
    details: { requestId, docType },
    created_at: now,
  };
  memoryAuditLogs.unshift(log);

  if (admin) {
    try {
      await admin.from("admin_audit_logs").insert({
        admin_id: adminUser.id,
        target_user_id: targetUserId,
        action: "approve_verification",
        details: { requestId },
      });
    } catch (e) {
      console.error("[Failed to insert audit log in Supabase]", e);
    }
  }

  // 2. Send AfroMessage SMS notification
  if (targetPhone) {
    const sms =
      "Congratulations! Your Furni Gebeya seller/supplier account has been verified. You can now post furniture listings.";
    await sendOtpViaAfroMessage(targetPhone, sms);
  }

  return { success: true };
}

/**
 * Admin action: Reject verification request with reason
 */
export async function rejectVerification(
  adminUser: UserProfile,
  requestId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || !reason.trim()) {
    return { success: false, error: "Rejection reason is required." };
  }

  let req = memoryVerifications.get(requestId);
  const now = new Date().toISOString();

  if (req) {
    req.status = "rejected";
    req.rejection_reason = reason.trim();
    req.reviewed_by = adminUser.id;
    req.reviewed_at = now;
    memoryVerifications.set(requestId, req);
  }

  const admin = getSupabaseAdmin();
  let targetUserId = req?.user_id;
  let targetPhone = req?.user_phone;

  if (admin) {
    try {
      const { data } = await admin
        .from("verification_requests")
        .update({
          status: "rejected",
          rejection_reason: reason.trim(),
          reviewed_by: adminUser.id,
          reviewed_at: now,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (data) targetUserId = data.user_id;
    } catch (e) {
      console.error("[Supabase reject error]", e);
    }
  }

  if (targetUserId) {
    await updateUserVerificationStatus(targetUserId, "rejected", false);
  }

  // 1. Log Admin Action
  const log: AdminAuditLog = {
    id: crypto.randomUUID(),
    admin_id: adminUser.id,
    admin_name: adminUser.full_name,
    target_user_id: targetUserId || "unknown",
    target_phone: targetPhone || "",
    action: "reject_verification",
    details: { requestId, reason: reason.trim() },
    created_at: now,
  };
  memoryAuditLogs.unshift(log);

  if (admin) {
    try {
      await admin.from("admin_audit_logs").insert({
        admin_id: adminUser.id,
        target_user_id: targetUserId,
        action: "reject_verification",
        details: { requestId, reason: reason.trim() },
      });
    } catch (e) {
      console.error("[Failed to insert audit log in Supabase]", e);
    }
  }

  // 2. Send AfroMessage SMS notification
  if (targetPhone) {
    const sms = `Your Furni Gebeya verification request was rejected. Reason: ${reason.trim()}. Please update your documents to re-apply.`;
    await sendOtpViaAfroMessage(targetPhone, sms);
  }

  return { success: true };
}

/**
 * Admin action: Request more documents
 */
export async function requestMoreDocuments(
  adminUser: UserProfile,
  requestId: string,
  instructions: string
): Promise<{ success: boolean; error?: string }> {
  if (!instructions || !instructions.trim()) {
    return { success: false, error: "Please specify what documents or changes are needed." };
  }

  let req = memoryVerifications.get(requestId);
  const now = new Date().toISOString();

  if (req) {
    req.status = "more_documents_requested";
    req.rejection_reason = instructions.trim();
    req.reviewed_by = adminUser.id;
    req.reviewed_at = now;
    memoryVerifications.set(requestId, req);
  }

  const admin = getSupabaseAdmin();
  let targetUserId = req?.user_id;
  let targetPhone = req?.user_phone;

  if (admin) {
    try {
      const { data } = await admin
        .from("verification_requests")
        .update({
          status: "more_documents_requested",
          rejection_reason: instructions.trim(),
          reviewed_by: adminUser.id,
          reviewed_at: now,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (data) targetUserId = data.user_id;
    } catch (e) {
      console.error("[Supabase request more docs error]", e);
    }
  }

  if (targetUserId) {
    await updateUserVerificationStatus(targetUserId, "more_documents_requested", false);
  }

  // 1. Log Admin Action
  const log: AdminAuditLog = {
    id: crypto.randomUUID(),
    admin_id: adminUser.id,
    admin_name: adminUser.full_name,
    target_user_id: targetUserId || "unknown",
    target_phone: targetPhone || "",
    action: "request_more_documents",
    details: { requestId, instructions: instructions.trim() },
    created_at: now,
  };
  memoryAuditLogs.unshift(log);

  if (admin) {
    try {
      await admin.from("admin_audit_logs").insert({
        admin_id: adminUser.id,
        target_user_id: targetUserId,
        action: "request_more_documents",
        details: { requestId, instructions: instructions.trim() },
      });
    } catch (e) {
      console.error("[Failed to insert audit log in Supabase]", e);
    }
  }

  // 2. Send AfroMessage SMS notification
  if (targetPhone) {
    const sms = `Furni Gebeya: Additional verification documents requested: ${instructions.trim()}. Please visit your profile to upload.`;
    await sendOtpViaAfroMessage(targetPhone, sms);
  }

  return { success: true };
}

/**
 * Returns recent admin audit logs
 */
export async function getAdminAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("admin_audit_logs")
        .select(`
          *,
          admin:admin_id (full_name),
          target:target_user_id (phone_number)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          admin_id: d.admin_id,
          admin_name: d.admin?.full_name || "Admin",
          target_user_id: d.target_user_id,
          target_phone: d.target?.phone_number || "",
          action: d.action,
          details: d.details || {},
          ip_address: d.ip_address,
          created_at: d.created_at,
        }));
      }
    } catch (e) {
      console.warn("[Failed to fetch audit logs from Supabase]", e);
    }
  }

  return memoryAuditLogs.slice(0, limit);
}
