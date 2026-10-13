import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { recordContactView, isSubscriptionActive } from "@/lib/marketplace-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to view seller contact information." },
        { status: 401 }
      );
    }

    const { targetUserId, listingId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing target user ID." }, { status: 400 });
    }

    // Check if seller's subscription or trial is active
    const isActive = await isSubscriptionActive(targetUserId);

    // Record the contact view audit log
    await recordContactView(user.id, targetUserId, listingId);

    return NextResponse.json({
      success: true,
      subscriptionActive: isActive,
      message: isActive ? "Contact view logged." : "Seller subscription has expired.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record contact view." }, { status: 500 });
  }
}
