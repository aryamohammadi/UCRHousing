# UCR HousingConnect

A lightweight web platform that connects UCR students with off-campus housing options.

## Features

- Interactive map showing available housing options
- Detailed property listings with photos and amenities
- Filtering system to find properties that match specific criteria
- Form for property owners to submit new listings
- AI assistant that helps match student needs with available listings

## Technology Stack

- Backend: Python 3.x with Flask
- Database: SQLite (development) → PostgreSQL (production)
- ORM: SQLAlchemy with Flask-SQLAlchemy
- Templating: Jinja2
- Styling: Tailwind CSS via CDN
- Frontend: Vanilla JavaScript with Fetch API
- Map: Leaflet.js + OpenStreetMap
- AI: OpenAI API with GPT-3.5

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
