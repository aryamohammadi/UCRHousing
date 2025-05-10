# App Directory Documentation

The `app` directory contains the core application code for UCR HousingConnect. This document outlines the structure and purpose of this directory.

## Directory Structure

```
app/
├── __init__.py          # App initialization and configuration
├── config.py            # Configuration settings
├── matching.py          # Rule-based matching system
├── models.py            # Database models
├── utils.py             # General utility functions
├── routes/              # Application routes and controllers
├── templates/           # Jinja2 HTML templates
├── static/              # Static assets (CSS, JS, images)
└── utils/               # Additional utility modules
```

## Core Files

### **init**.py

The application factory that:

- Initializes Flask app and extensions
- Sets up configuration
- Registers blueprints
- Configures the database
- Ensures NLTK data is downloaded for the matching system

### config.py

Contains the Config class that defines configuration parameters:

- Database URI
- Secret key
- API keys (Google Maps)
- Session settings

### matching.py

Implements the rule-based housing search system:

- Natural language processing for query understanding
- Preference extraction (bedrooms, price, amenities, etc.)
- Scoring algorithm to rank listings by relevance
- Response generation with explanations

### models.py

Contains SQLAlchemy models representing database tables:

- Listing: Housing properties with details
- Amenity: Housing features (parking, laundry, etc.)
- Many-to-many relationships between listings and amenities

### utils.py

General utility functions:

- Address geocoding
- Data validation
- Helper functions used across the application

## Subfolders

### routes/

The routes directory contains Flask blueprints for different sections of the application:

- `home.py`: Main landing page and listing overview
- `listing.py`: Individual listing views and forms
- `chat.py`: Rule-based matching chat interface
- `admin.py`: Administrative functions

### templates/

Contains Jinja2 HTML templates organized by feature:

- `base.html`: Base template with common layout elements
- `home/`: Homepage templates
- `listing/`: Listing detail and form templates
- `chat/`: Chat interface templates
- `admin/`: Admin dashboard templates

### static/

Contains static assets:

- CSS: Styling (uses Tailwind CSS)
- JavaScript: Client-side functionality
- Images: Site graphics and icons
- Fonts: Typography resources

### utils/

Additional utility modules for specific functions:

- Data parsing
- API clients
- Complex operations
