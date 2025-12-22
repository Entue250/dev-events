"use server";

import Admin from "@/database/admin.model";
import connectDB from "../mongodb";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";
const OTP_EXPIRY_MINUTES = 10;

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

// Generate JWT Token
const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Generate 6-digit OTP
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Sign Up with Email/Password
export const signUpWithEmail = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) => {
  try {
    await connectDB();

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return { success: false, message: "Email already registered" };
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
      name,
      role: "admin",
    });

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    await admin.save();

    // Send OTP via email
    try {
      const { sendOTPEmail } = await import("../email");
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Still return success but log OTP for development
      console.log(`OTP for ${email}: ${otp} (email service unavailable)`);
    }

    return {
      success: true,
      message:
        "Admin created. Please check your email for the verification code.",
    };
  } catch (e) {
    console.error("Sign up failed", e);
    return { success: false, message: "Sign up failed" };
  }
};

// Sign In with Email/Password
export const signInWithEmail = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    await connectDB();

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !admin.password) {
      return { success: false, message: "Invalid credentials" };
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return { success: false, message: "Invalid credentials" };
    }

    if (!admin.isEmailVerified) {
      // Generate new OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      admin.otp = otp;
      admin.otpExpiry = otpExpiry;
      await admin.save();

      // Send OTP via email
      try {
        const { sendOTPEmail } = await import("../email");
        await sendOTPEmail(email, otp, admin.name);
        console.log(
          `✅ OTP email sent successfully to edouardoniyomugabo@gmail.com for user: ${email}`
        );
        console.log(`📧 OTP Code: ${otp} (also sent to email)`);
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        console.log(`⚠️ Email failed, but here's the OTP for ${email}: ${otp}`);
      }

      return {
        success: false,
        message:
          "Please verify your email. Check your inbox for the verification code.",
        requiresOTP: true,
      };
    }

    // Generate JWT
    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return {
      success: true,
      message: "Sign in successful",
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
    };
  } catch (e) {
    console.error("Sign in failed", e);
    return { success: false, message: "Sign in failed" };
  }
};

// Verify OTP
export const verifyOTP = async ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) => {
  try {
    await connectDB();

    const admin = await Admin.findOne({ email }).select("+otp +otpExpiry");
    if (!admin) {
      return { success: false, message: "Admin not found" };
    }

    if (!admin.otp || !admin.otpExpiry) {
      return {
        success: false,
        message: "No OTP found. Please request a new one.",
      };
    }

    if (new Date() > admin.otpExpiry) {
      return {
        success: false,
        message: "OTP expired. Please request a new one.",
      };
    }

    if (admin.otp !== otp) {
      return { success: false, message: "Invalid OTP" };
    }

    // Mark email as verified
    admin.isEmailVerified = true;
    admin.otp = undefined;
    admin.otpExpiry = undefined;
    await admin.save();

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("../email");
      await sendWelcomeEmail(email, admin.name);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // Generate JWT
    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return {
      success: true,
      message: "Email verified successfully",
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
    };
  } catch (e) {
    console.error("OTP verification failed", e);
    return { success: false, message: "OTP verification failed" };
  }
};

// Sign In/Up with Google
export const signInWithGoogle = async ({
  email,
  name,
  googleId,
  avatar,
}: {
  email: string;
  name: string;
  googleId: string;
  avatar?: string;
}) => {
  try {
    await connectDB();

    let admin = await Admin.findOne({ email });

    if (!admin) {
      // Create new admin
      admin = await Admin.create({
        email,
        name,
        googleId,
        avatar,
        isEmailVerified: true,
        role: "admin",
      });
    } else if (!admin.googleId) {
      // Link Google account
      admin.googleId = googleId;
      admin.isEmailVerified = true;
      if (avatar) admin.avatar = avatar;
      await admin.save();
    }

    // Generate JWT
    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return {
      success: true,
      message: "Google sign in successful",
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
    };
  } catch (e) {
    console.error("Google sign in failed", e);
    return { success: false, message: "Google sign in failed" };
  }
};

// Verify Token and Get Current Admin
export const getCurrentAdmin = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token")?.value;

    if (!token) {
      return { success: false, message: "Not authenticated" };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    await connectDB();
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return { success: false, message: "Admin not found" };
    }

    return {
      success: true,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
    };
  } catch (e) {
    return { success: false, message: "Invalid or expired token" };
  }
};

// Sign Out
export const signOut = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin-token");

    return { success: true, message: "Signed out successfully" };
  } catch (e) {
    return { success: false, message: "Sign out failed" };
  }
};

// Resend OTP
export const resendOTP = async ({ email }: { email: string }) => {
  try {
    await connectDB();

    const admin = await Admin.findOne({ email }).select("+otp +otpExpiry");
    if (!admin) {
      return { success: false, message: "Admin not found" };
    }

    if (admin.isEmailVerified) {
      return { success: false, message: "Email already verified" };
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    await admin.save();

    // Send OTP via email
    try {
      const { sendOTPEmail } = await import("../email");
      await sendOTPEmail(email, otp, admin.name);
      console.log(
        `✅ OTP resent successfully to edouardoniyomugabo@gmail.com for user: ${email}`
      );
      console.log(`📧 OTP Code: ${otp} (also sent to email)`);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      console.log(`⚠️ Email failed, but here's the OTP for ${email}: ${otp}`);
    }

    return {
      success: true,
      message: "Verification code sent to your email",
    };
  } catch (e) {
    console.error("Resend OTP failed", e);
    return { success: false, message: "Failed to resend OTP" };
  }
};
