"""Telemetry, logging, and observability utilities."""

import sys
from pathlib import Path
from typing import Optional

from loguru import logger


def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None):
    """
    Configure loguru logger with appropriate handlers.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional path to log file
    """
    # Remove default handler
    logger.remove()
    
    # Add console handler with formatting
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True,
    )
    
    # Add file handler if specified
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        logger.add(
            log_file,
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            rotation="10 MB",
            retention="7 days",
            compression="zip",
        )
    
    logger.info(f"Logging initialized at {log_level} level")


def get_logger(name: str):
    """
    Get a logger instance for a module.
    
    Args:
        name: Module name (typically __name__)
    
    Returns:
        Logger instance
    """
    return logger.bind(name=name)


# Optional: Prometheus metrics placeholder
class MetricsCollector:
    """
    Placeholder for Prometheus metrics collection.
    Can be extended with prometheus_client library.
    """
    
    def __init__(self):
        self.metrics = {}
    
    def increment_counter(self, name: str, value: float = 1.0, labels: dict = None):
        """Increment a counter metric."""
        key = f"{name}_{labels}" if labels else name
        self.metrics[key] = self.metrics.get(key, 0) + value
    
    def set_gauge(self, name: str, value: float, labels: dict = None):
        """Set a gauge metric."""
        key = f"{name}_{labels}" if labels else name
        self.metrics[key] = value
    
    def observe_histogram(self, name: str, value: float, labels: dict = None):
        """Observe a histogram metric."""
        key = f"{name}_{labels}" if labels else name
        if key not in self.metrics:
            self.metrics[key] = []
        self.metrics[key].append(value)
    
    def get_metrics(self) -> dict:
        """Get all collected metrics."""
        return self.metrics


# Global metrics collector instance
_metrics_collector = MetricsCollector()


def get_metrics_collector() -> MetricsCollector:
    """Get the global metrics collector instance."""
    return _metrics_collector
