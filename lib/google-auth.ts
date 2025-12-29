// Google OAuth configuration and helper functions

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string; // Google user ID
  email_verified: boolean;
}

/**
 * Fetch user info from Google using access token
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch Google user info");
      return null;
    }

    const userInfo: GoogleUserInfo = await response.json();
    return userInfo;
  } catch (error) {
    console.error("Error fetching Google user info:", error);
    return null;
  }
}
