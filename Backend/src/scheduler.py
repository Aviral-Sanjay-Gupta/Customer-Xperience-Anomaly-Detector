"""Scheduler for automated batch scoring and alerting."""

import os
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

from src.alerts import send_anomaly_alert
from src.predict import load_artifacts, predict_batch, save_predictions
from src.telemetry import get_logger, setup_logging
from src.train import load_config

load_dotenv()

log = get_logger(__name__)


def run_batch_scoring_job():
    """
    Execute batch scoring job and send alerts if anomalies detected.
    """
    log.info("=" * 60)
    log.info(f"Starting scheduled batch scoring job at {datetime.utcnow().isoformat()}")
    log.info("=" * 60)
    
    try:
        # Load configuration
        config = load_config()
        
        # Load model artifacts
        preprocessor, model, metadata = load_artifacts(config)
        
        # Run batch predictions
        results_df = predict_batch(config, preprocessor, model, metadata)
        
        # Save results
        output_path = save_predictions(results_df, config)
        
        # Count anomalies
        num_anomalies = results_df["is_anomaly"].sum()
        total_records = len(results_df)
        threshold = metadata["threshold"]
        
        log.info(f"Batch job completed: {num_anomalies} anomalies in {total_records} records")
        
        # Send alert if anomalies detected
        if num_anomalies > 0:
            send_anomaly_alert(
                num_anomalies=num_anomalies,
                total_records=total_records,
                output_path=output_path,
                threshold=threshold,
            )
        
        log.info("Batch scoring job completed successfully")
        
    except Exception as e:
        log.error(f"Batch scoring job failed: {e}")
        # Optionally send failure alert
        error_message = f"🔴 Batch Scoring Job Failed\n\nError: {str(e)}"
        try:
            from src.alerts import send_slack_alert
            send_slack_alert(error_message)
        except:
            pass


def start_scheduler():
    """
    Start the APScheduler with configured jobs.
    """
    # Check if scheduler is enabled
    scheduler_enabled = os.getenv("ENABLE_SCHEDULER", "false").lower() == "true"
    if not scheduler_enabled:
        log.info("Scheduler disabled via ENABLE_SCHEDULER environment variable")
        log.info("Set ENABLE_SCHEDULER=true to enable automated batch scoring")
        return
    
    # Get cron expression from environment
    cron_expr = os.getenv("BATCH_SCORE_CRON", "0 */6 * * *")  # Default: every 6 hours
    
    log.info("=" * 60)
    log.info("Starting CX Anomaly Detection Scheduler")
    log.info("=" * 60)
    log.info(f"Batch scoring schedule (cron): {cron_expr}")
    
    # Create scheduler
    scheduler = BlockingScheduler()
    
    # Parse cron expression and add job
    # Cron format: minute hour day month day_of_week
    parts = cron_expr.split()
    if len(parts) != 5:
        log.error(f"Invalid cron expression: {cron_expr}")
        return
    
    trigger = CronTrigger(
        minute=parts[0],
        hour=parts[1],
        day=parts[2],
        month=parts[3],
        day_of_week=parts[4],
    )
    
    scheduler.add_job(
        run_batch_scoring_job,
        trigger=trigger,
        id="batch_scoring_job",
        name="Batch Anomaly Scoring",
        replace_existing=True,
    )
    
    log.info("Scheduler configured successfully")
    log.info("Press Ctrl+C to stop the scheduler")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Scheduler stopped by user")
        scheduler.shutdown()


def main():
    """Main entry point for scheduler."""
    # Setup logging
    log_level = os.getenv("LOG_LEVEL", "INFO")
    setup_logging(log_level=log_level)
    
    # Start scheduler
    start_scheduler()


if __name__ == "__main__":
    main()
