import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  getAdminSubscriptions,
  recordSubscriptionPayment,
  extendUserTrial,
} from "@/lib/marketplace-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const subscriptions = await getAdminSubscriptions();
    return NextResponse.json({ subscriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "record_payment") {
      const { userId, amount, paymentMethod, paymentReference, daysDuration, notes } = body;
      if (!userId || !amount || !paymentMethod) {
        return NextResponse.json({ error: "Missing required payment fields." }, { status: 400 });
      }

      const sub = await recordSubscriptionPayment({
        userId,
        adminId: user.id,
        amount: Number(amount),
        paymentMethod,
        paymentReference,
        daysDuration: Number(daysDuration) || 30,
        notes,
      });

      return NextResponse.json({ success: true, subscription: sub });
    }

    if (action === "extend_trial") {
      const { userId, extraDays } = body;
      if (!userId || !extraDays) {
        return NextResponse.json({ error: "Missing userId or extraDays" }, { status: 400 });
      }

      const res = await extendUserTrial(userId, Number(extraDays));
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed processing subscription action" }, { status: 500 });
  }
}
