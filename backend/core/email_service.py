"""
Finto Email Service — Send OTP emails with branded HTML template
Uses Python built-in smtplib (no extra dependencies needed)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import get_settings


def _build_otp_html(otp: str, email: str) -> str:
    """Build a beautiful branded HTML email for OTP delivery"""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); padding: 36px 40px; text-align: center;">
              <div style="font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ₹into
              </div>
              <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0; letter-spacing: 0.5px;">
                AI-Powered GST Reconciliation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1e293b;">
                Welcome to Finto! 👋
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; color: #64748b; line-height: 1.6;">
                We received a sign-in request for <strong style="color: #1e293b;">{email}</strong>. Use the verification code below to complete your login.
              </p>

              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%); border: 2px solid #bfdbfe; border-radius: 12px; padding: 28px; text-align: center; margin: 0 0 28px;">
                <p style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 600;">
                  Your Verification Code
                </p>
                <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1e40af; font-family: 'Courier New', monospace;">
                  {otp}
                </div>
              </div>

              <p style="margin: 0 0 6px; font-size: 13px; color: #94a3b8;">
                ⏰ This code expires in <strong style="color: #64748b;">5 minutes</strong>.
              </p>
              <p style="margin: 0 0 0; font-size: 13px; color: #94a3b8;">
                🔒 If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #475569;">
                Warm regards,
              </p>
              <p style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #1e40af;">
                Team Finto
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                AI-Powered GST Reconciliation • Cut reconciliation time by 60-70%
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_otp_email(email: str, otp: str) -> bool:
    """
    Send OTP to the given email address.
    Returns True if sent successfully, False if SMTP is not configured or sending failed.
    The caller should always print the OTP to console as a fallback.
    """
    settings = get_settings()

    # Check if SMTP is configured
    if not settings.smtp_username or not settings.smtp_password:
        print("⚠️  SMTP not configured — skipping email delivery (OTP printed to console only)")
        return False

    try:
        from_email = settings.smtp_from_email or settings.smtp_username
        from_name = settings.smtp_from_name

        # Build the email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 Your Finto Login Code: {otp}"
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = email

        # Plain text fallback
        plain_text = (
            f"Welcome to Finto!\n\n"
            f"Your verification code is: {otp}\n\n"
            f"This code expires in 5 minutes.\n"
            f"If you didn't request this, please ignore this email.\n\n"
            f"— Team Finto"
        )
        msg.attach(MIMEText(plain_text, "plain"))

        # HTML version
        html_content = _build_otp_html(otp, email)
        msg.attach(MIMEText(html_content, "html"))

        # Send via SMTP
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(from_email, email, msg.as_string())

        print(f"✅ OTP email sent to {email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send OTP email: {e}")
        return False
