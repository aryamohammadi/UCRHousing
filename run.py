#!/usr/bin/env python
from app import create_app
import os
import argparse
from datetime import datetime

app = create_app()

# Add a context processor to provide the current year for the footer
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the Flask application')
    parser.add_argument('--port', type=int, default=int(os.environ.get('FLASK_PORT', 5000)), 
                        help='Port number to run the server on (default: 5000)')
    parser.add_argument('--host', type=str, default=os.environ.get('FLASK_HOST', '0.0.0.0'),
                        help='Host to run the server on (default: 0.0.0.0)')
    args = parser.parse_args()
    
    # Use environment variables or default values for host and port
    host = args.host
    port = args.port
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    app.run(host=host, port=port, debug=debug) 