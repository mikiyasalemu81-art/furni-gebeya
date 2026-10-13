import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { markListingSold } from "@/lib/listings-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUserProfile();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const isSold = Boolean(body?.isSold);

    const updated = await markListingSold(user, id, isSold);

    if (!updated) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, listing: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
