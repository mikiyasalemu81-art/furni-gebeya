import { NextRequest, NextResponse } from "next/server";
import { setUserRole, UserRole } from "@/lib/auth-session";

const validRoles: UserRole[] = ["buyer", "seller", "supplier"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = body?.role as UserRole;

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected. Must be 'buyer', 'seller', or 'supplier'." },
        { status: 400 }
      );
    }

    const updatedProfile = await setUserRole(role);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "You must be logged in to select a role." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("[Set Role API Error]", err);
    return NextResponse.json(
      { error: "Failed to update user role." },
      { status: 500 }
    );
  }
}
