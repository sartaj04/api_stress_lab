"""
Internal API endpoints for worker-to-backend communication.
These endpoints are called by the Celery worker to trigger actions on the backend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..email import send_suite_completion_email, send_admin_test_queued_notification

router = APIRouter(prefix="/internal", tags=["internal"])


class SuiteCompletionEmail(BaseModel):
    email: str
    project_name: str
    suite_id: str
    suite_url: str
    completed_tests: int
    total_tests: int


class AdminQueueNotification(BaseModel):
    project_name: str
    user_email: str
    test_type: str


@router.post("/send-suite-completion-email")
def send_suite_completion(data: SuiteCompletionEmail):
    """
    Send suite completion email via SMTP.
    Called by worker when a test suite completes.
    """
    success = send_suite_completion_email(
        email=data.email,
        project_name=data.project_name,
        suite_id=data.suite_id,
        suite_url=data.suite_url,
        completed_tests=data.completed_tests,
        total_tests=data.total_tests
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"success": True, "message": "Email sent"}


@router.post("/send-admin-queue-notification")
def send_admin_notification(data: AdminQueueNotification):
    """
    Send admin notification that a test was queued.
    Called by backend when user queues a test.
    """
    success = send_admin_test_queued_notification(
        project_name=data.project_name,
        user_email=data.user_email,
        test_type=data.test_type
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"success": True, "message": "Email sent"}
