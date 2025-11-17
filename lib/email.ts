import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "DevSphere <onboarding@resend.dev>", // Change to your verified domain in production
      to: [email],
      subject: "Verify Your DevSphere Admin Account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #59deca;
                margin-bottom: 10px;
              }
              .otp-box {
                background: linear-gradient(135deg, #59deca 0%, #4bc9b5 100%);
                color: #000;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                text-align: center;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
              }
              .content {
                color: #555;
                font-size: 16px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #999;
                font-size: 14px;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
                color: #856404;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎯 DevSphere</div>
                <h1 style="color: #333; margin: 0;">Verify Your Email</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${name}</strong>,</p>
                <p>Thank you for registering as an admin on DevSphere! To complete your registration, please use the following One-Time Password (OTP):</p>
                
                <div class="otp-box">
                  ${otp}
                </div>
                
                <div class="warning">
                  <strong>⏰ This OTP expires in 10 minutes.</strong>
                </div>
                
                <p>If you didn't request this verification, please ignore this email or contact support if you have concerns.</p>
                
                <p>Best regards,<br>The DevSphere Team</p>
              </div>
              
              <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} DevSphere. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "DevSphere <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to DevSphere Admin Panel!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #59deca 0%, #4bc9b5 100%);
                color: #000;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #59deca;">🎉 Welcome to DevSphere!</h1>
              <p>Hi <strong>${name}</strong>,</p>
              <p>Your admin account has been successfully verified! You now have full access to the DevSphere admin dashboard.</p>
              
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>Create and manage tech events</li>
                <li>Track event bookings</li>
                <li>Engage with the developer community</li>
              </ul>
              
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/dashboard" class="button">
                Go to Dashboard
              </a>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Best regards,<br>The DevSphere Team</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email service error:", error);
    return { success: false, error };
  }
}