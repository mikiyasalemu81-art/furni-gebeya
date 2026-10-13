import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { createReview, getProfileReviews } from "@/lib/marketplace-service";

// GET /api/reviews?targetUserId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("targetUserId");
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId parameter." }, { status: 400 });
    }

    const data = await getProfileReviews(targetUserId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to submit a review." }, { status: 401 });
    }

    const { targetUserId, rating, comment } = await req.json();
    if (!targetUserId || !rating || !comment) {
      return NextResponse.json({ error: "Rating and review comment are required." }, { status: 400 });
    }

    const review = await createReview({
      reviewer: user,
      targetUserId,
      rating: Number(rating),
      comment,
    });

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit review." }, { status: 400 });
  }
}
