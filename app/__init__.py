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
    
    # Set default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            'DATABASE_URL', 'sqlite:///' + os.path.join(app.instance_path, 'housing.sqlite')
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY')
    )
    
    # Load the instance config, if it exists, when not testing
    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)
    
    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize extensions with the app
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    from app.routes.home import home_bp
    from app.routes.listing import listing_bp
    from app.routes.chat import chat_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(listing_bp)
    app.register_blueprint(chat_bp)
    
    # A simple route to confirm the app is working
    @app.route('/ping')
    def ping():
        return 'pong'
    
    # Create database tables within app context
    with app.app_context():
        db.create_all()
    
    return app
