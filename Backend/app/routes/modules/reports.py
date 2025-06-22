# app/routes/modules/reports.py
import hmac
import hashlib
import base64
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse

from auth.services.user_service import get_current_user
from core.database import get_db
from core.database.models import User, Report  # Assuming a Report model exists
from config import settings
from core.utils.logger import logger

router = APIRouter(prefix="/reports", tags=["reports"])

# --- Helper Functions for Signed URLs --- #

def generate_signed_token(report_id: str, expires_in_seconds: int = 600) -> str:
    """Generates a time-limited, HMAC-signed token for a report ID."""
    expires_at = int((datetime.utcnow() + timedelta(seconds=expires_in_seconds)).timestamp())
    message_to_sign = f"{report_id}:{expires_at}".encode('utf-8')
    secret_key = settings.SECRET_KEY.encode('utf-8')

    signature = hmac.new(secret_key, message_to_sign, hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(f"{expires_at}:{signature.hex()}".encode('utf-8')).decode('utf-8')
    return token

def verify_signed_token(token: str, report_id: str) -> bool:
    """Verifies a signed token and checks for expiration."""
    try:
        decoded_token = base64.urlsafe_b64decode(token).decode('utf-8')
        expires_at_str, received_signature_hex = decoded_token.split(':', 1)
        expires_at = int(expires_at_str)

        if datetime.utcnow().timestamp() > expires_at:
            logger.warning(f"Attempted to use expired token for report {report_id}")
            return False

        message_to_sign = f"{report_id}:{expires_at}".encode('utf-8')
        secret_key = settings.SECRET_KEY.encode('utf-8')
        expected_signature = hmac.new(secret_key, message_to_sign, hashlib.sha256).hexdigest()

        return hmac.compare_digest(received_signature_hex, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying signed token for report {report_id}: {e}")
        return False

# --- API Endpoints --- #

@router.get("/generate-link/{report_id}", summary="Generate Signed Report Download Link")
async def generate_report_download_link(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Generates a secure, time-limited URL for downloading a report.
    The link is valid for 10 minutes.
    """
    report = await db.get(Report, report_id)
    if not report or (report.user_id != current_user.id and not current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found or access denied")

    token = generate_signed_token(report_id)
    download_url = f"/api/v1/reports/download/{report_id}?token={token}"
    return {"download_url": download_url, "expires_in": "10 minutes"}

@router.get("/download/{report_id}", summary="Download Report with Signed Link")
async def download_report(
    report_id: str,
    token: str = Query(..., description="The signed token for download authorization"),
    db=Depends(get_db),
):
    """
    Downloads a report file if the provided token is valid and not expired.
    """
    if not verify_signed_token(token, report_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired download link.")

    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    # Assuming reports are stored in a directory specified in settings
    report_path = os.path.join(settings.REPORTS_DIR, f"{report.id}.pdf")

    if not os.path.exists(report_path):
        logger.error(f"Report file not found at path: {report_path}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file does not exist.")

    return FileResponse(report_path, filename=f"TrinetraSec_Report_{report.id}.pdf")
