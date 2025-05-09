from flask import Blueprint, render_template, redirect, url_for, flash, current_app, request
from app.models import Listing, Amenity
from app import db
import subprocess
import os
import logging
import csv
import tempfile
from datetime import datetime
from werkzeug.utils import secure_filename

# Create a blueprint for admin routes
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('', methods=['GET'])
def dashboard():
    """Admin dashboard"""
    # Count listings and amenities
    listing_count = Listing.query.count()
    amenity_count = Amenity.query.all()
    
    # Get source counts
    zillow_count = db.session.query(Listing).filter(
        Listing.description.like('%Living area of%')
    ).count()
    
    sample_count = db.session.query(Listing).filter(
        Listing.title.in_([
            "University Towers", 
            "Grand Marc at University Village",
            "Sterling Highlander",
            "The Palms on University",
            "Riverside House",
            "Canyon Crest Villas",
            "Bannockburn Village"
        ])
    ).count()
    
    user_count = listing_count - zillow_count - sample_count
    
    # Calculate the newest listing
    newest_listing = db.session.query(Listing).order_by(
        Listing.created_at.desc()
    ).first()
    
    newest_listing_date = newest_listing.created_at if newest_listing else None
    
    # Get last import time if it exists
    import_log_path = os.path.join(current_app.root_path, '..', 'housing_updates.log')
    last_import_time = None
    import_count = 0
    
    if os.path.exists(import_log_path):
        try:
            with open(import_log_path, 'r') as f:
                lines = f.readlines()
                if lines:
                    # Get the last line with a date
                    last_line = lines[-1]
                    if "complete at" in last_line:
                        date_str = last_line.split("complete at")[1].split('-')[0].strip()
                        last_import_time = date_str
                        
                        # Try to extract the import count
                        if "Added" in last_line and "listings" in last_line:
                            try:
                                count_str = last_line.split("Added")[1].split("listings")[0].strip()
                                import_count = int(count_str)
                            except (ValueError, IndexError):
                                pass
        except Exception as e:
            current_app.logger.error(f"Error reading import log: {str(e)}")
    
    # Get API key status
    api_key = os.environ.get('RAPIDAPI_KEY')
    api_key_status = "Configured" if api_key else "Not configured"
    
    return render_template('admin/dashboard.html', 
                          listing_count=listing_count,
                          amenities=amenity_count,
                          last_import=last_import_time,
                          last_import_count=import_count,
                          newest_listing_date=newest_listing_date,
                          zillow_count=zillow_count,
                          sample_count=sample_count,
                          user_count=user_count,
                          api_key_status=api_key_status)

@admin_bp.route('/import', methods=['GET'])
def import_data():
    """Trigger a data import from all sources"""
    try:
        # Execute the import script as a subprocess
        script_path = os.path.join(current_app.root_path, '..', 'import_housing_data.py')
        result = subprocess.run(['python3', script_path], 
                               capture_output=True, 
                               text=True,
                               check=True)
        
        # Log output to app logger
        current_app.logger.info(f"Import output: {result.stdout}")
        
        # Extract the number of listings imported from the output
        import_count = 0
        for line in result.stdout.split('\n'):
            if "Successfully imported" in line and "total new listings" in line:
                try:
                    import_count = int(line.split("Successfully imported")[1].split("total")[0].strip())
                except:
                    pass
        
        flash(f"Successfully imported {import_count} new listings", "success")
    except subprocess.CalledProcessError as e:
        current_app.logger.error(f"Import error: {e.stderr}")
        flash(f"Error importing data: {e.stderr}", "error")
    except Exception as e:
        current_app.logger.error(f"Import exception: {str(e)}")
        flash(f"Error importing data: {str(e)}", "error")
    
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/import/zillow', methods=['GET'])
def import_zillow():
    """Trigger data import specifically from Zillow API"""
    api_key = os.environ.get('RAPIDAPI_KEY')
    if not api_key:
        flash("No RapidAPI key configured. Set the RAPIDAPI_KEY environment variable.", "error")
        return redirect(url_for('admin.dashboard'))
    
    try:
        # Execute the import script focusing on Zillow
        script_path = os.path.join(current_app.root_path, '..', 'import_housing_data.py')
        # Specify zip codes to focus on near UCR
        result = subprocess.run(['python3', script_path, '--', '92507,92508,92521'], 
                               capture_output=True, 
                               text=True,
                               check=True)
        
        # Log output
        current_app.logger.info(f"Zillow import output: {result.stdout}")
        
        # Extract import count
        import_count = 0
        for line in result.stdout.split('\n'):
            if "Successfully imported" in line and "total new listings" in line:
                try:
                    import_count = int(line.split("Successfully imported")[1].split("total")[0].strip())
                except:
                    pass
                    
        flash(f"Successfully imported {import_count} new listings from Zillow API", "success")
    except Exception as e:
        current_app.logger.error(f"Zillow import error: {str(e)}")
        flash(f"Error importing from Zillow: {str(e)}", "error")
    
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/import/csv', methods=['GET', 'POST'])
def import_csv():
    """Import listings from a CSV file"""
    if request.method == 'POST':
        # Check if a file was uploaded
        if 'csv_file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
            
        file = request.files['csv_file']
        
        # Check if file is empty
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
            
        # Check if file is a CSV
        if not file.filename.endswith('.csv'):
            flash('File must be a CSV', 'error')
            return redirect(request.url)
        
        try:
            # Save the uploaded file to a temporary location
            temp_dir = tempfile.gettempdir()
            filename = secure_filename(file.filename)
            filepath = os.path.join(temp_dir, filename)
            file.save(filepath)
            
            # Execute the import script with the CSV file
            script_path = os.path.join(current_app.root_path, '..', 'import_housing_data.py')
            result = subprocess.run(['python3', script_path, filepath], 
                                  capture_output=True, 
                                  text=True,
                                  check=True)
            
            # Log output
            current_app.logger.info(f"CSV import output: {result.stdout}")
            
            # Extract import count
            import_count = 0
            for line in result.stdout.split('\n'):
                if "Imported" in line and "listings from CSV file" in line:
                    try:
                        import_count = int(line.split("Imported")[1].split("listings")[0].strip())
                    except:
                        pass
            
            # Clean up the temporary file
            os.unlink(filepath)
            
            flash(f"Successfully imported {import_count} listings from CSV", "success")
            return redirect(url_for('admin.dashboard'))
            
        except Exception as e:
            current_app.logger.error(f"CSV import error: {str(e)}")
            flash(f"Error importing from CSV: {str(e)}", "error")
            return redirect(request.url)
    
    # GET request - show the upload form
    return render_template('admin/csv_import.html')

@admin_bp.route('/export/template', methods=['GET'])
def export_template():
    """Download a CSV template for listing imports"""
    template_path = os.path.join(current_app.root_path, '..', 'listing_template.csv')
    
    if not os.path.exists(template_path):
        flash("Template file not found", "error")
        return redirect(url_for('admin.dashboard'))
    
    # Return the template file for download
    return redirect(url_for('static', filename='../listing_template.csv')) 