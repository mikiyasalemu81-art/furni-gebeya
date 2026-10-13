import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { getListings, createListing } from "@/lib/listings-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;
    const condition = (searchParams.get("condition") as any) || undefined;
    const material = searchParams.get("material") || undefined;
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const sellerId = searchParams.get("sellerId") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = (searchParams.get("sort") as any) || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;

    const result = await getListings({
      search,
      category,
      city,
      condition,
      material,
      verifiedOnly,
      sellerId,
      status,
      sort,
      minPrice,
      maxPrice,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Listings GET error]", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    // Role & Verification check
    if (user.role === "buyer") {
      return NextResponse.json(
        { error: "Only Sellers, Suppliers, and Admins can publish furniture listings." },
        { status: 403 }
      );
    }

    if (!user.is_verified && user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Your account must be verified by an administrator before publishing listings.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.title || !body.description || !body.category_id || !body.city) {
      return NextResponse.json(
        { error: "Title, description, category, and city are required." },
        { status: 400 }
      );
    }

    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least 1 photograph of the furniture." },
        { status: 400 }
      );
    }

    if (body.images.length > 4) {
      return NextResponse.json(
        { error: "A maximum of 4 photos is permitted per listing." },
        { status: 400 }
      );
    }

    const listing = await createListing(user, body);
    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (err: any) {
    console.error("[Listings POST error]", err);
    return NextResponse.json({ error: err.message || "Failed to create listing" }, { status: 500 });
  }
}
