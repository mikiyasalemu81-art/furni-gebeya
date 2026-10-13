import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import {
  getWantedRequests,
  createWantedRequest,
  updateWantedStatus,
} from "@/lib/marketplace-service";

// GET /api/wanted -> List active wanted requests with category/city filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;
    const status = searchParams.get("status") || "active";

    const requests = await getWantedRequests({
      categoryId,
      city,
      status,
    });

    return NextResponse.json({ requests });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load wanted requests" },
      { status: 500 }
    );
  }
}

// POST /api/wanted -> Create a new wanted request or update status
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "update_status") {
      const { requestId, status } = body;
      if (!requestId || !status) {
        return NextResponse.json({ error: "Missing requestId or status." }, { status: 400 });
      }

      const ok = await updateWantedStatus(requestId, user.id, status);
      if (!ok) {
        return NextResponse.json({ error: "Not authorized or request not found." }, { status: 403 });
      }
      return NextResponse.json({ success: true });
    }

    // Default action: Create request
    const {
      title,
      categoryId,
      categoryName,
      description,
      budgetMin,
      budgetMax,
      quantity,
      city,
      images,
    } = body;

    if (!title || !description || !city) {
      return NextResponse.json(
        { error: "Title, description, and city are required." },
        { status: 400 }
      );
    }

    const newRequest = await createWantedRequest({
      user,
      title,
      categoryId: categoryId || "cat-custom",
      categoryName: categoryName || "Custom Woodcraft",
      description,
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      quantity: quantity ? Number(quantity) : 1,
      city,
      images: images || [],
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
