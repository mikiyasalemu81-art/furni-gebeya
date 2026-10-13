import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { submitVerificationRequest } from "@/lib/verification-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { business_name, city, address, id_front_path, id_back_path, trade_license_path } = body;

    if (!business_name || !city || !address) {
      return NextResponse.json(
        { error: "Business name, city, and address are required." },
        { status: 400 }
      );
    }

    if (!id_front_path || !id_back_path || !trade_license_path) {
      return NextResponse.json(
        {
          error:
            "All three documents (National ID Front, National ID Back, and Trade License) must be uploaded.",
        },
        { status: 400 }
      );
    }

    const request = await submitVerificationRequest(user, {
      business_name: business_name.trim(),
      city: city.trim(),
      address: address.trim(),
      id_front_path,
      id_back_path,
      trade_license_path,
    });

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (err: any) {
    console.error("[Submit Verification Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit verification request." },
      { status: 500 }
    );
  }
}
