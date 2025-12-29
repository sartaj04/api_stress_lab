import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from .config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, reset_token: str, reset_url: str) -> bool:
    """
    Send a password reset email to the user.
    
    Args:
        email: User's email address
        reset_token: The reset token
        reset_url: The full URL to reset password (including token)
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    # If email is not configured, log and return False
    if not settings.smtp_enabled:
        logger.warning(f"Email not configured. Would send password reset to {email} with token: {reset_token}")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your Password - API Stress Lab"
        msg["From"] = settings.smtp_from_email
        msg["To"] = email
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #111113; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">API Stress Lab</h1>
            </div>
            
            <div style="background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                
                <div style="margin: 30px 0;">
                    <a href="{reset_url}" style="background: #111113; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{reset_url}" style="color: #0066cc; word-break: break-all;">{reset_url}</a>
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
        Reset Your Password - API Stress Lab
        
        We received a request to reset your password. Visit the link below to create a new password:
        
        {reset_url}
        
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        """
        
        # Attach both versions
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        return False

