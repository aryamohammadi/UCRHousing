# UCR HousingConnect

A lightweight web platform that connects UCR students with off-campus housing options.

## Features

- Interactive map showing available housing options
- Detailed property listings with photos and amenities
- Filtering system to find properties that match specific criteria
- Form for property owners to submit new listings
- AI assistant that helps match student needs with available listings
- Admin dashboard for data management
- Zillow API integration for real housing data
- CSV import/export for batch listing management
- Browse and filter housing listings based on price, size, amenities, etc.
- View property locations on an interactive map with distances to UCR
- Calculate walking and driving distances to UCR campus
- Submit new housing listings through a simple form
- Rule-based recommendation system to match your housing requirements
- Responsive design that works on desktop and mobile devices

## Rule-Based Matching System

The platform uses a sophisticated rule-based matching system to help students find housing that meets their specific requirements:

- **Natural Language Understanding**: The system can interpret natural language queries like "I need a 2-bedroom apartment near UCR under $2000 with parking and laundry"
- **Preference Extraction**: Automatically extracts information about bedrooms, bathrooms, price ranges, property types, desired amenities, and proximity to campus
- **Intelligent Scoring**: Each property is scored based on how well it matches your requirements
- **Explanation**: For each recommendation, the system explains why it's a good match for your needs
- **No API Keys Required**: The matching system works entirely locally without relying on external AI services

## Technology Stack

- Backend: Python 3.x with Flask
- Database: SQLite (development) → PostgreSQL (production)
- ORM: SQLAlchemy with Flask-SQLAlchemy
- Templating: Jinja2
- Styling: Tailwind CSS via CDN
- Frontend: Vanilla JavaScript with Fetch API
- Map: Leaflet.js + OpenStreetMap
- AI: OpenAI API with GPT-3.5
- Maps: Google Maps API for visualization and distance calculations
- Matching Engine: NLTK-based rule system with custom scoring algorithm

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/ucrhousing.git
   cd ucrhousing
   ```

2. Create a virtual environment

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies

   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example`

   ```
   cp .env.example .env
   ```

5. Edit the `.env` file with your configuration values

### Database Setup

Initialize the database with Flask-Migrate:

```
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

To apply future migrations:

```
flask db migrate -m "Description of changes"
flask db upgrade
```

### Importing Housing Data

The application supports multiple ways to import housing data:

1. **Zillow API Integration**:

   - Sign up at [RapidAPI](https://rapidapi.com/) and subscribe to a Zillow API
   - Set your `RAPIDAPI_KEY` in the `.env` file
   - Use the admin dashboard or run: `python import_housing_data.py`

2. **CSV Import**:

   - Use the template at `listing_template.csv`
   - Fill in your listing data
   - Import via admin dashboard or run: `python import_housing_data.py your_data.csv`

3. **Sample Data**:

   - Run `python seed_data.py` to populate with sample listings

4. **Automated Updates**:
   - Set up a cron job to run `update_housing_data.sh` periodically
   - Example: `0 0 * * 0 /path/to/update_housing_data.sh` (weekly)

### Running the Application

Start the development server:

```
python run.py
```

The application will be available at http://localhost:5000

## Deployment

For production deployment:

1. Set `FLASK_ENV=production` in your environment
2. Use a production WSGI server (e.g., Gunicorn)
3. Configure a PostgreSQL database
4. Set a secure SECRET_KEY

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Legal Notice

© 2025 UCR HousingConnect. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, public display, or public performance of this software is strictly prohibited.
