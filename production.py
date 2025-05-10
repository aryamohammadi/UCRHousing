#!/usr/bin/env python3
"""
Production server execution file for UCR HousingConnect.
This file configures and starts a production-ready Gunicorn WSGI server.

Usage:
    python production.py

Environment variables:
    PORT: The port to run the server on (default: 8000)
    WORKERS: Number of worker processes (default: calculated based on CPU cores)
    HOST: Host to bind to (default: 0.0.0.0)
"""

import os
import multiprocessing
import logging
import nltk
import ssl
from app import create_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def download_nltk_data():
    """Download required NLTK data with SSL verification disabled if needed"""
    try:
        # Create data directories if they don't exist
        nltk_data_dir = os.path.expanduser('~/nltk_data')
        os.makedirs(nltk_data_dir, exist_ok=True)
        
        # Try to download with normal SSL first
        try:
            logger.info("Downloading NLTK data...")
            nltk.download('punkt', download_dir=nltk_data_dir, quiet=False)
            nltk.download('stopwords', download_dir=nltk_data_dir, quiet=False)
        except ssl.SSLError:
            # If SSL verification fails, try without verification
            logger.warning("SSL verification failed, attempting without verification...")
            _create_unverified_https_context = ssl._create_unverified_context
            ssl._create_default_https_context = _create_unverified_https_context
            
            # Download required data with SSL verification disabled
            nltk.download('punkt', download_dir=nltk_data_dir, quiet=False)
            nltk.download('stopwords', download_dir=nltk_data_dir, quiet=False)
            
            # Restore default SSL context
            ssl._create_default_https_context = ssl.create_default_context
            
        logger.info("NLTK data downloaded successfully to %s", nltk_data_dir)
        return True
    except Exception as e:
        logger.error("Failed to download NLTK data: %s", str(e))
        return False

def run_gunicorn_server():
    """Configure and run the Gunicorn WSGI server"""
    try:
        # Get configuration from environment variables
        port = int(os.environ.get('PORT', 8000))
        host = os.environ.get('HOST', '0.0.0.0')
        
        # Calculate reasonable number of workers (2-4 x number of CPU cores)
        workers = int(os.environ.get('WORKERS', (multiprocessing.cpu_count() * 2) + 1))
        
        # Set environment to production
        os.environ['FLASK_ENV'] = 'production'
        
        # Log server configuration
        logger.info(f"Starting Gunicorn server on {host}:{port} with {workers} workers")
        
        # Import the Flask app
        app = create_app()
        
        # Start Gunicorn as a subprocess
        import gunicorn.app.base
        
        class GunicornApp(gunicorn.app.base.BaseApplication):
            def __init__(self, app, options=None):
                self.options = options or {}
                self.application = app
                super().__init__()
                
            def load_config(self):
                for key, value in self.options.items():
                    if key in self.cfg.settings and value is not None:
                        self.cfg.set(key.lower(), value)
                        
            def load(self):
                return self.application
        
        # Configure Gunicorn options
        options = {
            'bind': f'{host}:{port}',
            'workers': workers,
            'worker_class': 'sync',
            'timeout': 120,
            'keepalive': 5,
            'accesslog': '-',  # Log to stdout
            'errorlog': '-',   # Log to stderr
            'loglevel': 'info',
            'capture_output': True,
            'preload_app': True,
        }
        
        # Start Gunicorn
        GunicornApp(app, options).run()
        
    except Exception as e:
        logger.error(f"Failed to start Gunicorn server: {str(e)}")
        exit(1)

if __name__ == "__main__":
    # Download NLTK data before starting the server
    logger.info("Preparing production environment...")
    download_nltk_data()
    
    # Run the production server
    run_gunicorn_server() 