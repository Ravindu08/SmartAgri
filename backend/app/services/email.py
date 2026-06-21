"""
Email sending service.
When EMAIL_ENABLED=false (or SMTP vars not set), emails are printed to the console
so the feature works in local dev without a real SMTP account.
"""
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _is_enabled() -> bool:
    return os.getenv("EMAIL_ENABLED", "true").lower() == "true"


def _send(to_email: str, subject: str, html_body: str) -> None:
    if not _is_enabled():
        print(f"\n{'='*60}")
        print(f"[EMAIL — console fallback]")
        print(f"To:      {to_email}")
        print(f"Subject: {subject}")
        # Extract the plain link from the HTML for easy copy-paste
        import re
        links = re.findall(r'href="([^"]+)"', html_body)
        for link in links:
            if "token=" in link:
                print(f"Link:    {link}")
        print('='*60 + "\n")
        return

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_name = os.getenv("EMAILS_FROM_NAME", "SmartAgri")
    from_email = os.getenv("EMAILS_FROM_EMAIL", user)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port) as server:
        server.ehlo()
        server.starttls(context=context)
        server.login(user, password)
        server.sendmail(from_email, to_email, msg.as_string())


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def send_verification_email(to_email: str, full_name: str, token: str) -> None:
    url = f"{_frontend_url()}/verify-email?token={token}"
    subject = "Verify your SmartAgri account"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9f9f9">
      <div style="background:#fff;border-radius:10px;padding:32px;border:1px solid #e0e0e0">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:32px">🌿</span>
          <h2 style="color:#1a7a4a;margin:8px 0 0">SmartAgri</h2>
        </div>
        <h3 style="color:#111;margin-bottom:8px">Hi {full_name},</h3>
        <p style="color:#555;line-height:1.6">
          Welcome to SmartAgri! Please verify your email address to activate your account.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="{url}"
             style="background:#1a7a4a;color:#fff;padding:13px 32px;border-radius:7px;
                    text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Verify Email Address
          </a>
        </div>
        <p style="color:#888;font-size:13px">
          Or copy this link into your browser:<br>
          <span style="color:#1a7a4a;word-break:break-all">{url}</span>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#aaa;font-size:12px;text-align:center">
          If you did not create a SmartAgri account, you can safely ignore this email.
        </p>
      </div>
    </div>
    """
    _send(to_email, subject, html)


def send_password_reset_email(to_email: str, full_name: str, token: str) -> None:
    url = f"{_frontend_url()}/reset-password?token={token}"
    subject = "Reset your SmartAgri password"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9f9f9">
      <div style="background:#fff;border-radius:10px;padding:32px;border:1px solid #e0e0e0">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:32px">🌿</span>
          <h2 style="color:#1a7a4a;margin:8px 0 0">SmartAgri</h2>
        </div>
        <h3 style="color:#111;margin-bottom:8px">Hi {full_name},</h3>
        <p style="color:#555;line-height:1.6">
          We received a request to reset your SmartAgri password. Click the button below to choose a new password.
          This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="{url}"
             style="background:#1a7a4a;color:#fff;padding:13px 32px;border-radius:7px;
                    text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
            Reset Password
          </a>
        </div>
        <p style="color:#888;font-size:13px">
          Or copy this link into your browser:<br>
          <span style="color:#1a7a4a;word-break:break-all">{url}</span>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#aaa;font-size:12px;text-align:center">
          If you did not request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
      </div>
    </div>
    """
    _send(to_email, subject, html)
