"""Alert notification utilities for anomaly detection."""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

import requests
from dotenv import load_dotenv

from src.telemetry import get_logger

load_dotenv()

log = get_logger(__name__)


def send_slack_alert(message: str, webhook_url: Optional[str] = None) -> bool:
    """
    Send alert to Slack via webhook.
    
    Args:
        message: Alert message
        webhook_url: Slack webhook URL (defaults to env var)
    
    Returns:
        True if successful, False otherwise
    """
    if not webhook_url:
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    if not webhook_url:
        log.warning("Slack webhook URL not configured, skipping alert")
        return False
    
    try:
        payload = {"text": message}
        response = requests.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
        
        log.info("Slack alert sent successfully")
        return True
        
    except Exception as e:
        log.error(f"Failed to send Slack alert: {e}")
        return False


def send_email_alert(
    subject: str,
    body: str,
    to_addresses: Optional[List[str]] = None,
    from_address: Optional[str] = None,
) -> bool:
    """
    Send email alert via SMTP.
    
    Args:
        subject: Email subject
        body: Email body
        to_addresses: List of recipient emails
        from_address: Sender email
    
    Returns:
        True if successful, False otherwise
    """
    # Get config from environment
    if not from_address:
        from_address = os.getenv("ALERT_EMAIL_FROM")
    if not to_addresses:
        to_str = os.getenv("ALERT_EMAIL_TO", "")
        to_addresses = [addr.strip() for addr in to_str.split(",") if addr.strip()]
    
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not all([from_address, to_addresses, smtp_user, smtp_password]):
        log.warning("Email configuration incomplete, skipping alert")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = from_address
        msg["To"] = ", ".join(to_addresses)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        
        # Send via SMTP
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        log.info(f"Email alert sent to {len(to_addresses)} recipients")
        return True
        
    except Exception as e:
        log.error(f"Failed to send email alert: {e}")
        return False


def format_anomaly_alert(
    num_anomalies: int,
    total_records: int,
    output_path: Optional[str] = None,
    threshold: Optional[float] = None,
) -> str:
    """
    Format anomaly detection alert message.
    
    Args:
        num_anomalies: Number of anomalies detected
        total_records: Total records processed
        output_path: Path to results file
        threshold: Anomaly threshold used
    
    Returns:
        Formatted alert message
    """
    percentage = 100 * num_anomalies / total_records if total_records > 0 else 0
    
    message = f"🚨 CX Anomaly Detection Alert\n\n"
    message += f"Detected {num_anomalies} anomalies out of {total_records} records ({percentage:.2f}%)\n"
    
    if threshold:
        message += f"Threshold: {threshold:.4f}\n"
    
    if output_path:
        message += f"\nResults saved to: {output_path}\n"
    
    message += f"\nPlease review the flagged interactions for potential issues."
    
    return message


def send_anomaly_alert(
    num_anomalies: int,
    total_records: int,
    output_path: Optional[str] = None,
    threshold: Optional[float] = None,
) -> None:
    """
    Send anomaly detection alert via configured channels.
    
    Args:
        num_anomalies: Number of anomalies detected
        total_records: Total records processed
        output_path: Path to results file
        threshold: Anomaly threshold used
    """
    # Check if alerts are enabled
    alerts_enabled = os.getenv("ENABLE_ALERTS", "false").lower() == "true"
    if not alerts_enabled:
        log.info("Alerts disabled, skipping notification")
        return
    
    # Format message
    message = format_anomaly_alert(num_anomalies, total_records, output_path, threshold)
    
    log.info(f"Sending alert for {num_anomalies} anomalies")
    
    # Send to Slack
    send_slack_alert(message)
    
    # Send email
    subject = f"CX Anomaly Alert: {num_anomalies} anomalies detected"
    send_email_alert(subject, message)


if __name__ == "__main__":
    # Test alerts
    test_message = "Test alert from CX Anomaly Detector"
    print("Testing Slack alert...")
    send_slack_alert(test_message)
    print("Testing email alert...")
    send_email_alert("Test Alert", test_message)
