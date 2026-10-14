import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch {
  // ignore
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_SECRET_KEY;
const adminPhone = process.env.ADMIN_PHONE || "+251907173634";

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function audit() {
  console.log("=== FURNI GEBEYA READ-ONLY DATA AUDIT ===");
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Target ADMIN_PHONE: ${adminPhone}\n`);

  // 1. Auth Users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  const authUsers = authData?.users || [];
  console.log(`--- 1. auth.users (${authUsers.length} total) ---`);
  authUsers.forEach((u) => {
    console.log(
      `  ID: ${u.id} | Phone: ${u.phone || "(no phone)"} | Email: ${u.email || "(no email)"} | Created: ${u.created_at} | Meta: ${JSON.stringify(u.user_metadata || {})}`
    );
  });

  // Helper table query
  const tables = [
    "profiles",
    "categories",
    "category_synonyms",
    "listings",
    "listing_images",
    "reviews",
    "favorites",
    "conversations",
    "messages",
    "notifications",
    "wanted_requests",
    "follows",
    "user_follows",
    "contact_views",
    "subscriptions",
    "reports",
    "verification_requests",
    "audit_logs",
    "otp_codes"
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" });

      if (error) {
        console.log(`\n--- ${table}: Error / Does not exist (${error.message}) ---`);
      } else {
        console.log(`\n--- ${table} (${data?.length || 0} rows) ---`);
        if (data && data.length > 0) {
          data.slice(0, 10).forEach((row) => {
            console.log(" ", JSON.stringify(row));
          });
          if (data.length > 10) {
            console.log(`  ... and ${data.length - 10} more rows`);
          }
        }
      }
    } catch (e: any) {
      console.log(`\n--- ${table}: Exception (${e.message}) ---`);
    }
  }

  // Cloudinary audit
  console.log("\n--- CLOUDINARY ASSETS AUDIT ---");
  try {
    const resourcesRes = await cloudinary.api.resources({
      max_results: 100,
      resource_type: "image",
    });
    console.log(`Cloudinary Images (${resourcesRes.resources?.length || 0} found):`);
    resourcesRes.resources?.forEach((r: any) => {
      console.log(`  Public ID: ${r.public_id} | Format: ${r.format} | Bytes: ${r.bytes} | Folder: ${r.folder || "(root)"} | Created: ${r.created_at} | URL: ${r.secure_url}`);
    });
  } catch (cErr: any) {
    console.log(`Cloudinary API check failed: ${cErr.message}`);
  }
}

audit().catch(console.error);
