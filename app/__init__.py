import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import nltk
import logging
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Initialize SQLAlchemy and Migrate instances
db = SQLAlchemy()
migrate = Migrate()

# Initialize Sentry if DSN is provided
sentry_dsn = os.environ.get('SENTRY_DSN')
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FlaskIntegration()],
        traces_sample_rate=1.0,
        environment=os.environ.get('FLASK_ENV', 'development'),
        send_default_pii=False
    )
    logger.info("Sentry initialized for error tracking")
else:
    logger.info("Sentry DSN not found, error tracking disabled")

def create_app(test_config=None):
    """
    Application factory function that creates and configures the Flask app
    """
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Ensure the instance folder exists before configuring the database
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        print(f"Instance path: {app.instance_path}")
    except OSError as e:
        print(f"Error creating instance directory: {e}")
    
    # Get absolute path for SQLite database
    db_path = os.path.abspath(os.path.join(app.instance_path, 'housing.sqlite'))
    print(f"Database path: {db_path}")
    
    # Check if OpenAI API key is available
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        # Mask most of the key for security in logs
        masked_key = openai_key[:4] + '...' + openai_key[-4:] if len(openai_key) > 8 else '****'
        print(f"OpenAI API Key found: {masked_key}")
    else:
        print("WARNING: OpenAI API Key not found in environment variables")
    
    # Set default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            'DATABASE_URL', 'sqlite:///' + db_path
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        OPENAI_API_KEY=openai_key
    )
    
    # Development-specific configuration
    if os.environ.get('FLASK_ENV') == 'development':
        print(f"Development mode active")
    
    # Print the database URI for debugging
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Load the instance config, if it exists, when not testing
    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Initialize extensions with the app
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    from app.routes.home import home_bp
    from app.routes.listing import listing_bp
    from app.routes.chat import chat_bp
    from app.routes.admin import admin_bp
    from app.routes.auth import auth_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(listing_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    
    # A simple route to confirm the app is working
    @app.route('/ping')
    def ping():
        return 'pong'
    
    # Create database tables within app context
    with app.app_context():
        db.create_all()
    
    # Configure NLTK to use local data directory instead of downloading
    nltk_data_dir = os.path.expanduser('~/nltk_data')
    nltk.data.path.insert(0, nltk_data_dir)
    
    # Check if NLTK data is available
    try:
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize
        
        # Test if we can access NLTK data
        stopwords.words('english')
        word_tokenize("This is a test sentence.")
        logger.info("NLTK data verified and ready")
    except LookupError as e:
        # If data is not available, inform the user to run the download script
        logger.warning(f"NLTK data not found: {str(e)}")
        logger.warning("Please run 'python download_nltk_data.py' to download required NLTK data")
        
        # Try using the download script directly as a last resort
        try:
            import sys
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from download_nltk_data import download_nltk_data
            
            logger.info("Attempting to download NLTK data...")
            if download_nltk_data():
                logger.info("NLTK data downloaded successfully")
            else:
                logger.error("Failed to download NLTK data")
        except Exception as e:
            logger.error(f"Error trying to download NLTK data: {str(e)}")
    
    return app
