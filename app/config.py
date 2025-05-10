import os
from datetime import timedelta

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'
    
    # Database configuration - SQLite for development, PostgreSQL for production
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    # Fix for SQLAlchemy/Heroku compatibility 
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    # Fallback to SQLite for development
    if not SQLALCHEMY_DATABASE_URI:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///housing.sqlite'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenAI configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # Google Maps configuration
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY') or 'AIzaSyAw-8BS5lJ-lt-lKDllhoiEktF3cQgSGto'
    
    # Session configuration
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'  # Only send cookies over HTTPS in production
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript from accessing cookies
    SESSION_COOKIE_SAMESITE = 'Lax'  # Restrict cookies to same site
    
    # Security headers
    PREFERRED_URL_SCHEME = 'https'  # Prefer HTTPS
    
    # Development mode
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    
    # NLTK configuration
    NLTK_DATA_PATH = os.path.expanduser('~/nltk_data') 