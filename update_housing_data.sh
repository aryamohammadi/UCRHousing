#!/bin/bash
# Script to update housing data automatically
# Add to crontab to run weekly: 0 0 * * 0 /path/to/update_housing_data.sh

# Navigate to project directory
cd "$(dirname "$0")"

# Activate virtual environment if using one
# source venv/bin/activate

# Set environment variables
export FLASK_APP=run.py
export FLASK_ENV=development

# Run the import script
echo "Updating housing data at $(date)"
python3 import_housing_data.py

# Log completion
echo "Housing data update complete at $(date)" >> housing_updates.log 