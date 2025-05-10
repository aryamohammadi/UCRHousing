# UCR HousingConnect Architecture

This document describes the architectural design of the UCR HousingConnect platform, including the overall structure, design patterns, and key components.

## Application Structure

UCR HousingConnect follows a modular Flask application structure organized around the Flask Application Factory pattern, which provides the following advantages:

- **Flexibility**: The application can be initialized with different configurations
- **Testability**: Easier to create and manage test instances
- **Organization**: Clear separation of concerns across modules

### Directory Structure

```
ucrhousing/
├── app/                      # Main application package
│   ├── __init__.py           # Application factory
│   ├── config.py             # Configuration classes
│   ├── models.py             # SQLAlchemy models
│   ├── matching.py           # Rule-based matching system
│   ├── routes/               # Route blueprints
│   │   ├── __init__.py
│   │   ├── admin.py          # Admin dashboard routes
│   │   ├── auth.py           # Authentication routes
│   │   ├── chat.py           # Housing assistant chat routes
│   │   ├── home.py           # Home page and listing search routes
│   │   └── listing.py        # Listing detail routes
│   ├── static/               # Static assets (JS, CSS, images)
│   │   ├── css/
│   │   ├── js/
│   │   └── img/
│   └── templates/            # Jinja2 templates
│       ├── admin/
│       ├── auth/
│       ├── chat/
│       ├── home/
│       └── listing/
├── docs/                     # Documentation files
├── instance/                 # Instance-specific configuration
├── migrations/               # Alembic database migrations
├── tests/                    # Test suite
├── download_nltk_data.py     # Script to download NLTK data
├── production.py             # Production server script
├── setup_postgres.py         # PostgreSQL setup script
├── run.py                    # Development server entry point
└── requirements.txt          # Python dependencies
```

## Design Patterns

### Model-View-Controller (MVC)

The application follows a loose MVC pattern:

- **Models**: SQLAlchemy database models in `app/models.py`
- **Views**: Jinja2 templates in `app/templates/`
- **Controllers**: Route handlers in the `app/routes/` directory

### Blueprint Pattern

Flask blueprints are used to organize route groups:

- Each blueprint encapsulates a specific feature area
- Blueprints can be registered conditionally (e.g., admin features)
- URL prefixes are used to separate different functional areas

### Repository Pattern

Data access is abstracted through SQLAlchemy models, providing:

- Centralized data access logic
- ORM for database interaction
- Migration support through Flask-Migrate (Alembic)

## Key Components

### Authentication System

- Session-based authentication using Flask's session mechanism
- Password hashing using Werkzeug's security utilities
- Role-based access control for admin and property manager features
- Login-required decorators for route protection

### Google Maps Integration

- Property visualization on interactive maps
- Driving and walking distance calculations to UCR campus
- Distance matrix API integration for travel times
- Geocoding for new property submissions

### Rule-Based Matching System

- Natural language processing with NLTK
- Feature extraction from user queries (bedrooms, price range, amenities)
- Property scoring algorithm based on requirement matching
- Explanation generation for why properties match criteria

### Database Schema

- Core entities: User, Listing, Amenity
- Many-to-many relationships for property amenities
- Support for multi-unit properties with various floor plans
- SQLite for development, PostgreSQL for production

## Scalability Considerations

- Database connection pooling with psycopg2-pool
- Static asset caching through Nginx configuration
- Environment-specific configuration via dotenv
- Error monitoring with Sentry integration
- Modular design allowing for future expansion

## Performance Optimizations

- Caching Google Maps API responses
- Efficient database queries using SQLAlchemy
- Pagination for listing results
- Lazy loading of related objects
- Proper indexing on database tables

## Security Measures

- HTTPS enforcement
- Secure cookies with HTTPOnly, Secure, and SameSite flags
- CSRF protection
- Password hashing with salting
- Content Security Policy headers
- Environment-based secrets management
