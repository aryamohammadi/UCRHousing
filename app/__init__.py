import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize SQLAlchemy and Migrate instances
db = SQLAlchemy()
migrate = Migrate()

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
    
    app.register_blueprint(home_bp)
    app.register_blueprint(listing_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)
    
    # A simple route to confirm the app is working
    @app.route('/ping')
    def ping():
        return 'pong'
    
    # Create database tables within app context
    with app.app_context():
        db.create_all()
    
    return app
