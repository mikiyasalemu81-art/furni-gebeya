import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  getUserFavorites,
  toggleFavorite,
  isListingFavorited,
} from "@/lib/listings-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ favorites: [] });
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    if (listingId) {
      const isFav = await isListingFavorited(user.id, listingId);
      return NextResponse.json({ isFavorited: isFav });
    }

    const favorites = await getUserFavorites(user.id);
    return NextResponse.json({ favorites });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to save items." }, { status: 401 });
    }

    const body = await req.json();
    const listingId = body?.listingId;

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    const isFav = await toggleFavorite(user.id, listingId);
    return NextResponse.json({ success: true, isFavorited: isFav });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
