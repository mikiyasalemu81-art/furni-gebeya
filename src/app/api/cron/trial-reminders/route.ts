import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { memoryProfiles } from "@/lib/auth-session";
import { sendOtpViaAfroMessage } from "@/lib/otp-service";

export async function GET(req: NextRequest) {
  try {
    // Check Authorization Bearer or CRON_SECRET query
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET || "furni_gebeya_cron_secret_2026";

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      secret === cronSecret;

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }

    const now = new Date();
    const remindedUsers: string[] = [];

    // Query profiles in trial mode
    const admin = getSupabaseAdmin();
    let profilesToCheck: any[] = [];

    if (admin) {
      try {
        const { data } = await admin
          .from("profiles")
          .select("*")
          .eq("subscription_status", "trial")
          .not("trial_started_at", "is", null);
        if (data) profilesToCheck = data;
      } catch (e) {
        console.error("[Cron fetch error]", e);
      }
    }

    if (profilesToCheck.length === 0) {
      profilesToCheck = Array.from(memoryProfiles.values()).filter(
        (p) => p.subscription_status === "trial" && p.trial_started_at
      );
    }

    for (const user of profilesToCheck) {
      const trialStart = new Date(user.trial_started_at);
      const diffDays = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));

      // Day 20 reminder (10 days left)
      if (diffDays === 20) {
        const msg = `Furni Gebeya Notice: Your 30-day free trial has 10 days remaining. Please renew to keep your listings active.`;
        await sendOtpViaAfroMessage(user.phone_number, "10-DAY-TRIAL-ALERT");
        remindedUsers.push(`${user.phone_number} (Day 20 alert)`);
      }

      // Day 27 reminder (3 days left)
      if (diffDays === 27) {
        const msg = `Furni Gebeya Notice: URGENT - 3 days left on your free trial. Contact admin to renew subscription.`;
        await sendOtpViaAfroMessage(user.phone_number, "3-DAY-TRIAL-ALERT");
        remindedUsers.push(`${user.phone_number} (Day 27 urgent alert)`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      checkedCount: profilesToCheck.length,
      remindedCount: remindedUsers.length,
      remindedUsers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Cron job failed" }, { status: 500 });
  }
}
