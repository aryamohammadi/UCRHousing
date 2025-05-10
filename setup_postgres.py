#!/usr/bin/env python3
"""
PostgreSQL setup script for UCR HousingConnect.

This script helps set up a PostgreSQL database for production use:
1. Creates database tables
2. Adds essential initial data (admin user, amenities)

Usage:
    python setup_postgres.py

Environment variables required:
    DATABASE_URL: PostgreSQL connection string (postgresql://username:password@host:port/dbname)
    ADMIN_USERNAME: Admin username (default: admin)
    ADMIN_EMAIL: Admin email (default: admin@example.com)
    ADMIN_PASSWORD: Admin password (will prompt if not provided)
"""

import os
import sys
import getpass
import logging
from dotenv import load_dotenv
from flask import Flask
from app import db, create_app
from app.models import User, Amenity

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_postgres():
    """Set up PostgreSQL database and add initial data"""
    # Load environment variables from .env file
    load_dotenv()
    
    # Check if DATABASE_URL is set and is PostgreSQL
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        return False
    
    if not database_url.startswith(('postgresql://', 'postgres://')):
        logger.error("DATABASE_URL must be a PostgreSQL connection string")
        return False
    
    # Fix for SQLAlchemy/Heroku compatibility
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        os.environ['DATABASE_URL'] = database_url
    
    # Set environment to production
    os.environ['FLASK_ENV'] = 'production'
    
    try:
        # Create Flask app with PostgreSQL configuration
        app = create_app()
        
        with app.app_context():
            # Create database tables
            logger.info("Creating database tables...")
            db.create_all()
            
            # Check if admin user needs to be created
            admin = User.query.filter_by(role='admin').first()
            if not admin:
                logger.info("Creating admin user...")
                
                # Get admin credentials
                admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
                admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
                admin_password = os.environ.get('ADMIN_PASSWORD')
                
                if not admin_password:
                    admin_password = getpass.getpass("Enter admin password: ")
                
                # Create admin user
                admin = User(username=admin_username, email=admin_email, role='admin')
                admin.set_password(admin_password)
                db.session.add(admin)
                logger.info(f"Admin user '{admin_username}' created")
            
            # Check if amenities need to be created
            if Amenity.query.count() == 0:
                logger.info("Creating standard amenities...")
                
                # List of common housing amenities
                amenities = [
                    Amenity(name='Parking', icon='fa-car'),
                    Amenity(name='Laundry', icon='fa-washer'),
                    Amenity(name='Pool', icon='fa-swimming-pool'),
                    Amenity(name='Gym', icon='fa-dumbbell'),
                    Amenity(name='Air Conditioning', icon='fa-snowflake'),
                    Amenity(name='Pets Allowed', icon='fa-paw'),
                    Amenity(name='Furnished', icon='fa-couch'),
                    Amenity(name='Dishwasher', icon='fa-sink'),
                    Amenity(name='Internet', icon='fa-wifi'),
                    Amenity(name='Balcony', icon='fa-door-open'),
                    Amenity(name='Elevator', icon='fa-elevator'),
                    Amenity(name='Security System', icon='fa-shield-alt')
                ]
                
                db.session.add_all(amenities)
                logger.info(f"Added {len(amenities)} standard amenities")
            
            # Commit all changes
            db.session.commit()
            logger.info("Database setup completed successfully")
            return True
            
    except Exception as e:
        logger.error(f"Database setup failed: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting PostgreSQL database setup...")
    success = setup_postgres()
    if success:
        logger.info("PostgreSQL database setup completed successfully")
        sys.exit(0)
    else:
        logger.error("PostgreSQL database setup failed")
        sys.exit(1) 