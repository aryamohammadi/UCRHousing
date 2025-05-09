from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from app.models import Listing, Amenity
from app import db
from datetime import datetime
import re
from app.utils import geocode_address

# Create a blueprint for listing routes
listing_bp = Blueprint('listing', __name__, url_prefix='/listing')

@listing_bp.route('/<int:listing_id>')
def view(listing_id):
    """View a single listing's details"""
    listing = Listing.query.get_or_404(listing_id)
    return render_template('listing/detail.html', listing=listing)

@listing_bp.route('/new', methods=['GET', 'POST'])
def new():
    """Form for submitting a new listing"""
    if request.method == 'POST':
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        address = request.form.get('address')
        price = request.form.get('price')
        bedrooms = request.form.get('bedrooms')
        bathrooms = request.form.get('bathrooms')
        square_feet = request.form.get('square_feet')
        property_type = request.form.get('property_type')
        available_date = request.form.get('available_date')
        contact_email = request.form.get('contact_email')
        contact_phone = request.form.get('contact_phone')
        amenity_ids = request.form.getlist('amenities')
        
        # Basic validation
        errors = []
        if not title or not description or not address or not price:
            errors.append("Required fields missing")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", contact_email):
            errors.append("Invalid email address")
        
        if errors:
            # If validation fails, return to form with errors
            amenities = Amenity.query.all()
            return render_template('listing/new.html', 
                                  amenities=amenities, 
                                  errors=errors, 
                                  form=request.form)
        
        # Convert string values to appropriate types
        try:
            price = float(price)
            bedrooms = int(bedrooms)
            bathrooms = float(bathrooms)
            square_feet = int(square_feet) if square_feet else None
            available_date = datetime.strptime(available_date, '%Y-%m-%d').date() if available_date else None
        except ValueError:
            amenities = Amenity.query.all()
            return render_template('listing/new.html', 
                                  amenities=amenities, 
                                  errors=["Invalid numeric values"], 
                                  form=request.form)
        
        # Geocode the address to get latitude and longitude
        lat, lng = geocode_address(address)
        
        # Create new listing
        listing = Listing(
            title=title,
            description=description,
            address=address,
            price=price,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            square_feet=square_feet,
            property_type=property_type,
            available_date=available_date,
            latitude=lat,
            longitude=lng,
            contact_email=contact_email,
            contact_phone=contact_phone
        )
        
        # Add amenities
        if amenity_ids:
            amenities = Amenity.query.filter(Amenity.id.in_(amenity_ids)).all()
            listing.amenities = amenities
        
        # Save to database
        db.session.add(listing)
        db.session.commit()
        
        flash("Listing successfully created!", "success")
        return redirect(url_for('listing.view', listing_id=listing.id))
    
    # GET request - show form
    amenities = Amenity.query.all()
    return render_template('listing/new.html', amenities=amenities)
