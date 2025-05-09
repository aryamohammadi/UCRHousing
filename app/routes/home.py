from flask import Blueprint, render_template, request, jsonify
from app.models import Listing, Amenity
from app import db

# Create a blueprint for home routes
home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def index():
    """Homepage route displaying the map and listing filters"""
    # Get all amenities for the filter form
    amenities = Amenity.query.all()
    
    # Default filter values
    min_price = request.args.get('min_price', 0, type=int)
    max_price = request.args.get('max_price', 5000, type=int)
    bedrooms = request.args.get('bedrooms', 0, type=int)
    bathrooms = request.args.get('bathrooms', 0, type=float)
    property_type = request.args.get('property_type', '')
    
    return render_template('home/index.html', 
                          amenities=amenities,
                          min_price=min_price,
                          max_price=max_price,
                          bedrooms=bedrooms,
                          bathrooms=bathrooms,
                          property_type=property_type)

@home_bp.route('/api/listings')
def get_listings():
    """API endpoint to return filtered listings for the map"""
    # Get filter parameters
    min_price = request.args.get('min_price', 0, type=int)
    max_price = request.args.get('max_price', 10000, type=int)
    bedrooms = request.args.get('bedrooms', 0, type=int)
    bathrooms = request.args.get('bathrooms', 0, type=float)
    property_type = request.args.get('property_type', None)
    amenities = request.args.getlist('amenities')
    
    # Start with a base query
    query = Listing.query
    
    # Apply filters
    if min_price:
        query = query.filter(Listing.price >= min_price)
    if max_price:
        query = query.filter(Listing.price <= max_price)
    if bedrooms:
        query = query.filter(Listing.bedrooms >= bedrooms)
    if bathrooms:
        query = query.filter(Listing.bathrooms >= bathrooms)
    if property_type:
        query = query.filter(Listing.property_type == property_type)
    
    # Apply amenity filters if provided
    if amenities:
        for amenity_id in amenities:
            query = query.filter(Listing.amenities.any(Amenity.id == amenity_id))
    
    # Execute query and convert to dictionaries
    listings = [listing.to_dict() for listing in query.all()]
    
    return jsonify(listings)
