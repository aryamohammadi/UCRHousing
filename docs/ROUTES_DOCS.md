# Routes Directory Documentation

The `routes` directory contains all the Flask blueprints that define the application's endpoints. Each file represents a different section of the application's functionality.

## Directory Structure

```
routes/
├── __init__.py      # Blueprint initialization
├── home.py          # Homepage and listing overview routes
├── listing.py       # Individual listing detail routes
├── chat.py          # Rule-based matching system routes
└── admin.py         # Administrative interface routes
```

## Blueprint Files

### home.py

Handles the main landing page and listing overview:

- `GET /`: Main landing page with map and listing overview
- `GET /api/listings`: API endpoint that returns filtered listings as JSON
- Uses Google Maps for property visualization
- Implements filtering functionality

### listing.py

Manages individual listings:

- `GET /listing/<id>`: View a specific listing
- `GET /listing/new`: Form for creating a new listing
- `POST /listing/new`: Endpoint to submit a new listing
- `GET /listing/<id>/edit`: Form for editing a listing
- `POST /listing/<id>/edit`: Endpoint to update a listing
- `POST /listing/<id>/delete`: Endpoint to remove a listing
- Handles geocoding for addresses

### chat.py

Powers the rule-based matching system:

- `GET /chat`: Chat interface
- `POST /chat/ask`: Processes user queries and returns matches
- Uses the ListingMatcher class for natural language processing
- Scores listings based on user preferences
- Returns relevant matches with explanations

### admin.py

Provides administrative functions:

- `GET /admin`: Admin dashboard
- `GET /admin/listings`: List all listings
- `GET /admin/import`: Data import interface
- `POST /admin/import`: Handle data import
- `GET /admin/export`: Export listing data
- Statistical overview of housing data

## Key Implementation Details

### Authentication and Authorization

The admin routes include simple authentication to prevent unauthorized access. In a production environment, this should be enhanced with proper user management.

### Data Validation

All form submissions undergo validation before being processed. This includes:

- Required field checking
- Data type validation
- Format validation (email, phone, etc.)

### Error Handling

Routes include error handling for common issues:

- Database errors
- Invalid input
- Missing resources

### Response Formats

- HTML responses for browser viewing
- JSON responses for API endpoints
- Error messages formatted appropriately for the request type
