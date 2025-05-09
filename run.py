#!/usr/bin/env python
from app import create_app
import os
from datetime import datetime

app = create_app()

# Add a context processor to provide the current year for the footer
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

if __name__ == '__main__':
    # Use environment variables or default values for host and port
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    app.run(host=host, port=port, debug=debug) 