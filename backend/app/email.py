import resend
from app.config import settings

resend.api_key = settings.RESEND_API_KEY


def send_email(to: str, subject: str, html: str):
    """Send an email via Resend. Fails silently if API key is not configured."""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL SKIP] No RESEND_API_KEY configured. Would have sent to {to}: {subject}")
        return
    try:
        resend.Emails.send({
            "from": "PlantSync <notifications@plantsync.io>",
            "to": to,
            "subject": subject,
            "html": html,
        })
        print(f"[EMAIL] Sent to {to}: {subject}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to}: {e}")
