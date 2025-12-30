from typing import Optional
import logging

from .config import settings

logger = logging.getLogger(__name__)


def send_email_via_resend(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """
    Send email using Resend API.

    Returns:
        True if email was sent successfully, False otherwise
    """
    if not settings.resend_api_key:
        return False

    try:
        import resend
        resend.api_key = settings.resend_api_key

        params = {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body
        }

        resend.Emails.send(params)
        logger.info(f"Resend email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send Resend email to {to_email}: {str(e)}")
        return False


def send_password_reset_email(email: str, reset_token: str, reset_url: str) -> bool:
    """
    Send a password reset email to the user.
    Uses Resend API if available, falls back to SMTP.

    Args:
        email: User's email address
        reset_token: The reset token
        reset_url: The full URL to reset password (including token)

    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = "Reset Your Password - API Stress Lab"

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

    # Send via Resend (only option on Railway/Render)
    if not settings.resend_api_key:
        logger.error(f"RESEND_API_KEY not configured. Cannot send password reset email to {email}")
        return False

    logger.info(f"Sending password reset email via Resend to {email}")
    return send_email_via_resend(email, subject, html_body, text_body)


def send_email_verification_email(email: str, verification_url: str) -> bool:
    """
    Send an email verification email to the user.
    Uses Resend API.

    Args:
        email: User's email address
        verification_url: The full URL to verify email (including token)

    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = "Verify Your Email - API Stress Lab"

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
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            <p>Welcome to API Stress Lab! Please verify your email address to start running load tests.</p>

            <div style="margin: 30px 0;">
                <a href="{verification_url}" style="background: #111113; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                    Verify Email Address
                </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="{verification_url}" style="color: #0066cc; word-break: break-all;">{verification_url}</a>
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                This link will expire in 24 hours. If you didn't create an account with API Stress Lab, you can safely ignore this email.
            </p>
        </div>
    </body>
    </html>
    """

    # Create plain text version
    text_body = f"""
    Verify Your Email Address - API Stress Lab

    Welcome to API Stress Lab! Please verify your email address to start running load tests.

    Visit the link below to verify your email:

    {verification_url}

    This link will expire in 24 hours. If you didn't create an account with API Stress Lab, you can safely ignore this email.
    """

    # Send via Resend
    if not settings.resend_api_key:
        logger.error(f"RESEND_API_KEY not configured. Cannot send verification email to {email}")
        return False

    logger.info(f"Sending email verification via Resend to {email}")
    return send_email_via_resend(email, subject, html_body, text_body)


def send_suite_completion_email(email: str, project_name: str, suite_id: str, suite_url: str, completed_tests: int, total_tests: int) -> bool:
    """
    Send a notification email when a test suite completes.
    Uses Resend API.

    Args:
        email: User's email address
        project_name: Name of the project
        suite_id: The suite ID
        suite_url: The full URL to view the suite results
        completed_tests: Number of completed tests
        total_tests: Total number of tests in the suite

    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = f"Test Suite Complete - {project_name} | API Stress Lab"

    # Create HTML email body
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
    <div style="background: #111113; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">API Stress Lab</h1>
    </div>

    <div style="background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Test Suite Complete</h2>
        <p>Your test suite for <strong>{project_name}</strong> has finished running.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="color: #666; font-size: 14px; padding-bottom: 10px;">Tests Completed</td>
                    <td style="color: #333; font-weight: 600; font-size: 18px; text-align: right; padding-bottom: 10px;">{completed_tests} / {total_tests}</td>
                </tr>
            </table>
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                <div style="width: {(completed_tests / total_tests * 100) if total_tests > 0 else 0}%; height: 100%; background: #10b981;"></div>
            </div>
        </div>

        <p style="color: #666; font-size: 14px; margin: 20px 0;">
            View detailed results, performance metrics, and insights for your test suite.
        </p>

        <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
            <tr>
                <td style="background: #111113; border-radius: 6px;">
                    <a href="{suite_url}" style="background: #111113; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Results</a>
                </td>
            </tr>
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            This is an automated notification from API Stress Lab.<br>
            API Stress Lab, Load Testing Platform<br>
            <a href="https://apistresslab.com" style="color: #666; text-decoration: none;">apistresslab.com</a>
        </p>
    </div>
</body>
</html>"""

    # Create plain text version
    text_body = f"""Test Suite Complete - {project_name}

Your test suite for {project_name} has finished running.

Tests Completed: {completed_tests} / {total_tests}

View your test results here:
{suite_url}

---
This is an automated notification from API Stress Lab.
API Stress Lab - Load Testing Platform
https://apistresslab.com"""

    # Send via Resend (only option on Railway/Render)
    if not settings.resend_api_key:
        logger.error(f"RESEND_API_KEY not configured. Cannot send suite completion email to {email}")
        return False

    logger.info(f"Sending suite completion email via Resend to {email}")
    return send_email_via_resend(email, subject, html_body, text_body)


def send_admin_test_queued_notification(project_name: str, user_email: str, test_type: str) -> bool:
    """
    Send a notification to admin when a test is queued (to start local worker).
    Uses Resend API.

    Args:
        project_name: Name of the project
        user_email: Email of user who queued the test
        test_type: Type of test (e.g., "Full Suite", "Smoke Test", etc.)

    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = f"⚡ Test Queued - Start Docker Worker | API Stress Lab"
    admin_email = "contact@apistresslab.com"  # Admin email for notifications

    # Create HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">⚡ Action Required</h1>
        </div>

        <div style="background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Test Queued - Start Worker</h2>
            <p>A test has been queued and needs your local worker to process it.</p>

            <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-weight: 600;">Project: {project_name}</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">User: {user_email}</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">Test Type: {test_type}</p>
            </div>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-family: monospace; font-size: 14px; color: #333;">
                    <strong>Run this command:</strong><br><br>
                    cd api_stress_lab<br>
                    docker-compose up worker
                </p>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                This is an automated notification sent when tests are queued in production.
            </p>
        </div>
    </body>
    </html>
    """

    # Create plain text version
    text_body = f"""
    ⚡ Test Queued - Start Docker Worker

    A test has been queued and needs your local worker to process it.

    Project: {project_name}
    User: {user_email}
    Test Type: {test_type}

    Run this command:
    cd api_stress_lab
    docker-compose up worker

    This is an automated notification sent when tests are queued in production.
    """

    # Send via Resend (only option on Railway/Render)
    if not settings.resend_api_key:
        logger.error(f"RESEND_API_KEY not configured. Cannot send admin notification")
        return False

    logger.info(f"Sending admin notification via Resend to {admin_email}")
    return send_email_via_resend(admin_email, subject, html_body, text_body)

