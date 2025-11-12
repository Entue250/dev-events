import { NextRequest, NextResponse } from "next/server";
import {
  signUpWithEmail,
  signInWithEmail,
  verifyOTP,
  signInWithGoogle,
  signOut,
  getCurrentAdmin,
  resendOTP,
} from "@/lib/actions/auth.actions";

// Sign Up
export async function POST(req: NextRequest) {
  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case "signup":
        return NextResponse.json(await signUpWithEmail(data), { status: 200 });

      case "signin":
        return NextResponse.json(await signInWithEmail(data), { status: 200 });

      case "verify-otp":
        return NextResponse.json(await verifyOTP(data), { status: 200 });

      case "google-signin":
        return NextResponse.json(await signInWithGoogle(data), { status: 200 });

      case "signout":
        return NextResponse.json(await signOut(), { status: 200 });

      case "resend-otp":
        return NextResponse.json(await resendOTP(data), { status: 200 });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (e) {
    console.error("Auth API error:", e);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Get Current Admin
export async function GET() {
  try {
    const result = await getCurrentAdmin();
    return NextResponse.json(result, {
      status: result.success ? 200 : 401,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Failed to get admin" },
      { status: 500 }
    );
  }
}
