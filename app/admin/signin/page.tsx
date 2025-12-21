"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID, getGoogleUserInfo } from "@/lib/google-auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function SignInForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    otp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const action = isSignUp ? "signup" : "signin";
      const response = await fetch(`${BASE_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email: formData.email,
          password: formData.password,
          name: isSignUp ? formData.name : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (isSignUp || data.requiresOTP) {
          setShowOTP(true);
          setSuccessMessage(data.message);
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        if (data.requiresOTP) {
          setShowOTP(true);
          setSuccessMessage(
            "Please verify your email with the code sent to your inbox"
          );
        } else {
          setError(data.message);
        }
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: formData.email,
          otp: formData.otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/dashboard");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend-otp",
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Verification code sent to your email!");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");

      try {
        // Get user info from Google
        const userInfo = await getGoogleUserInfo(tokenResponse.access_token);

        if (!userInfo) {
          setError("Failed to get user information from Google");
          setLoading(false);
          return;
        }

        // Send to our backend
        const response = await fetch(`${BASE_URL}/api/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "google-signin",
            email: userInfo.email,
            name: userInfo.name,
            googleId: userInfo.sub,
            avatar: userInfo.picture,
          }),
        });

        const data = await response.json();

        if (data.success) {
          router.push("/admin/dashboard");
        } else {
          setError(data.message || "Google sign in failed");
        }
      } catch (err) {
        setError("Google sign in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google sign in was cancelled or failed");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass p-8 rounded-lg">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icons/logo.png" alt="logo" width={32} height={32} />
              <span className="text-2xl font-bold">DevSphere</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Admin{" "}
              {showOTP ? "Verify Email" : isSignUp ? "Sign Up" : "Sign In"}
            </h2>
            <p className="text-light-200">
              {showOTP
                ? "Enter the code sent to your email"
                : isSignUp
                ? "Create your admin account"
                : "Access the admin dashboard"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-md mb-4 text-sm">
              {successMessage}
            </div>
          )}

          {!showOTP ? (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-dark-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-dark-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full bg-dark-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-dark-100 text-light-200">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={() => googleLogin()}
                disabled={loading || !GOOGLE_CLIENT_ID}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {!GOOGLE_CLIENT_ID
                  ? "Google OAuth not configured"
                  : "Sign in with Google"}
              </button>

              {/* Toggle Sign Up/In */}
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* OTP Form */}
              <form onSubmit={handleOTPVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full bg-dark-200 rounded-md px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="000000"
                  />
                  <p className="text-xs text-light-200 mt-2 text-center">
                    Check your email for the 6-digit code
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="w-full text-primary hover:text-primary/80 text-sm disabled:opacity-50"
                >
                  Resend Code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    setFormData({ ...formData, otp: "" });
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="w-full text-light-200 hover:text-white text-sm"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSignIn() {
  if (!GOOGLE_CLIENT_ID) {
    console.warn(
      "Google OAuth not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file"
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SignInForm />
    </GoogleOAuthProvider>
  );
}
