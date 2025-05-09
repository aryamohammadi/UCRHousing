#!/usr/bin/env python3
"""
Seed script to populate the database with sample housing listings
Run with: python3 seed_data.py
"""
from app import create_app, db
from app.models import Listing, Amenity
from datetime import datetime, timedelta
import random

def create_amenities():
    """Create common housing amenities"""
    amenities = [
        {"name": "Parking", "icon": "car"},
        {"name": "In-unit Laundry", "icon": "washing-machine"},
        {"name": "Dishwasher", "icon": "dishwasher"},
        {"name": "Air Conditioning", "icon": "snowflake"},
        {"name": "Heating", "icon": "fire"},
        {"name": "Pet Friendly", "icon": "paw"},
        {"name": "Gym", "icon": "dumbbell"},
        {"name": "Pool", "icon": "water"},
        {"name": "Furnished", "icon": "couch"},
        {"name": "Balcony", "icon": "door-open"},
        {"name": "Security System", "icon": "shield"},
        {"name": "Elevator", "icon": "arrow-up"},
        {"name": "Wheelchair Accessible", "icon": "wheelchair"}
    ]
    
    for amenity_data in amenities:
        existing = Amenity.query.filter_by(name=amenity_data["name"]).first()
        if not existing:
            amenity = Amenity(name=amenity_data["name"], icon=amenity_data["icon"])
            db.session.add(amenity)
    
    db.session.commit()
    return Amenity.query.all()

def create_listings(amenities):
    """Create sample housing listings"""
    # UCR area coordinates
    ucr_lat, ucr_lng = 33.9737, -117.3281
    
    listings = [
        {
            "title": "University Village Apartment",
            "description": "Spacious 2-bedroom apartment close to campus. Ideal for students who want to be within walking distance to classes and dining options.",
            "address": "1200 University Ave, Riverside, CA 92507",
            "price": 1300,
            "bedrooms": 2,
            "bathrooms": 1.5,
            "square_feet": 850,
            "property_type": "Apartment",
            "available_date": datetime.now() + timedelta(days=14),
            "latitude": ucr_lat + 0.003,
            "longitude": ucr_lng - 0.002,
            "contact_email": "landlord@example.com",
            "contact_phone": "(951) 555-1234",
            "amenities": ["Parking", "Air Conditioning", "Heating"]
        },
        {
            "title": "Canyon Crest Condo",
            "description": "Modern 1-bedroom condo in the desirable Canyon Crest neighborhood. Recently renovated with stainless steel appliances and hardwood floors.",
            "address": "400 Canyon Crest Dr, Riverside, CA 92507",
            "price": 1150,
            "bedrooms": 1,
            "bathrooms": 1.0,
            "square_feet": 650,
            "property_type": "Condo",
            "available_date": datetime.now() + timedelta(days=7),
            "latitude": ucr_lat - 0.002,
            "longitude": ucr_lng + 0.005,
            "contact_email": "canyoncrest@example.com",
            "contact_phone": "(951) 555-5678",
            "amenities": ["In-unit Laundry", "Dishwasher", "Pool", "Gym"]
        },
        {
            "title": "Magnolia Townhouse",
            "description": "Spacious 3-bedroom townhouse in the Magnolia Center area. Features a private backyard, attached garage, and updated kitchen.",
            "address": "6700 Magnolia Ave, Riverside, CA 92506",
            "price": 1800,
            "bedrooms": 3,
            "bathrooms": 2.5,
            "square_feet": 1200,
            "property_type": "Townhouse",
            "available_date": datetime.now() + timedelta(days=30),
            "latitude": ucr_lat - 0.008,
            "longitude": ucr_lng - 0.006,
            "contact_email": "magnolia@example.com",
            "contact_phone": "(951) 555-9012",
            "amenities": ["Parking", "In-unit Laundry", "Dishwasher", "Pet Friendly"]
        },
        {
            "title": "Budget Studio Apartment",
            "description": "Cozy studio apartment just 10 minutes from campus. All utilities included. Perfect for students on a budget.",
            "address": "1800 University Ave, Riverside, CA 92507",
            "price": 850,
            "bedrooms": 0,
            "bathrooms": 1.0,
            "square_feet": 400,
            "property_type": "Studio",
            "available_date": datetime.now() + timedelta(days=1),
            "latitude": ucr_lat + 0.001,
            "longitude": ucr_lng + 0.003,
            "contact_email": "budget@example.com",
            "contact_phone": "(951) 555-3456",
            "amenities": ["Furnished", "Air Conditioning", "Heating"]
        },
        {
            "title": "Luxury Downtown Loft",
            "description": "Premium 2-bedroom loft in downtown Riverside. Industrial-style with high ceilings, exposed brick, and city views.",
            "address": "3500 Main St, Riverside, CA 92501",
            "price": 2100,
            "bedrooms": 2,
            "bathrooms": 2.0,
            "square_feet": 1100,
            "property_type": "Loft",
            "available_date": datetime.now() + timedelta(days=21),
            "latitude": ucr_lat - 0.01,
            "longitude": ucr_lng - 0.01,
            "contact_email": "downtown@example.com",
            "contact_phone": "(951) 555-7890",
            "amenities": ["Security System", "Elevator", "In-unit Laundry", "Parking", "Gym"]
        }
    ]
    
    amenity_dict = {a.name: a for a in amenities}
    
    for listing_data in listings:
        existing = Listing.query.filter_by(
            address=listing_data["address"],
            bedrooms=listing_data["bedrooms"]
        ).first()
        
        if not existing:
            # Extract amenity names and find the corresponding objects
            amenity_names = listing_data.pop("amenities", [])
            amenity_objects = [amenity_dict[name] for name in amenity_names if name in amenity_dict]
            
            # Create the listing
            listing = Listing(**listing_data)
            
            # Add the amenities
            listing.amenities.extend(amenity_objects)
            
            db.session.add(listing)
    
    db.session.commit()
    print(f"Added {len(listings)} sample listings to the database")

def main():
    """Initialize the app and populate the database"""
    app = create_app()
    with app.app_context():
        print("Creating amenities...")
        amenities = create_amenities()
        
        print("Creating listings...")
        create_listings(amenities)
        
        print("Seeding complete!")

if __name__ == "__main__":
    main() 