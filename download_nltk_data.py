#!/usr/bin/env python3
"""
This script downloads required NLTK data with SSL certificate verification disabled.
This is a workaround for SSL certificate verification issues and should only be used
during development or initial deployment.

For production, you should fix the SSL certificates properly rather than disabling verification.
"""

import os
import ssl
import nltk
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_nltk_data():
    """Download required NLTK data with SSL verification disabled"""
    try:
        # Create data directories if they don't exist
        nltk_data_dir = os.path.expanduser('~/nltk_data')
        os.makedirs(nltk_data_dir, exist_ok=True)
        
        # Create a custom SSL context that doesn't verify certificates
        custom_context = ssl._create_unverified_context()
        
        # Set the custom SSL context for NLTK downloader
        logger.info("Downloading NLTK data with SSL verification disabled...")
        
        # Temporarily disable SSL verification
        _create_unverified_https_context = ssl._create_unverified_context
        ssl._create_default_https_context = _create_unverified_https_context
        
        # Download required data
        nltk.download('punkt', download_dir=nltk_data_dir)
        nltk.download('stopwords', download_dir=nltk_data_dir)
        
        # Restore default SSL context
        ssl._create_default_https_context = ssl.create_default_context
        
        logger.info("NLTK data downloaded successfully to %s", nltk_data_dir)
        return True
    except Exception as e:
        logger.error("Failed to download NLTK data: %s", str(e))
        return False

if __name__ == "__main__":
    logger.info("Starting NLTK data download...")
    success = download_nltk_data()
    if success:
        logger.info("NLTK data download completed successfully")
    else:
        logger.error("NLTK data download failed") 