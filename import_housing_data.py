#!/usr/bin/env python3
"""
Script to import housing data from various public sources
Run with: python3 import_housing_data.py
"""
import requests
import json
import csv
import os
import time
import sys
import logging
from bs4 import BeautifulSoup
from app import create_app, db
from app.models import Listing, Amenity
from datetime import datetime, timedelta
import random
from urllib.parse import quote_plus
from pathlib import Path
import re

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("housing_import.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("housing_import")

# Constants
UCR_LAT, UCR_LNG = 33.9737, -117.3281
# Reduce to exactly 2 miles radius per requirements
MAX_DISTANCE_MILES = 2.0
UCR_ZIP_CODES = ["92507", "92508", "92521", "92504", "92506", "92505", "92501"]
MAX_PRICE = 5000  # Maximum reasonable price for student housing
MAX_RETRIES = 3   # Maximum number of API retry attempts

def get_sample_data():
    """Get sample data - for demo purposes"""
    return [
        {
            "title": "University Towers",
            "description": "Popular apartment complex across from UCR. Features furnished units, study rooms, and recreational facilities.",
            "address": "3500 Iowa Ave, Riverside, CA 92507",
            "price": 1250,
            "bedrooms": 2,
            "bathrooms": 2.0,
            "square_feet": 800,
            "property_type": "Apartment",
            "amenities": ["Furnished", "Pool", "Gym", "In-unit Laundry", "Parking"]
        },
        {
            "title": "Grand Marc at University Village",
            "description": "Modern student-focused apartments with resort-style pool, fitness center, and outdoor recreation areas.",
            "address": "3549 Iowa Ave, Riverside, CA 92507",
            "price": 1450,
            "bedrooms": 2,
            "bathrooms": 2.0,
            "square_feet": 850,
            "property_type": "Apartment",
            "amenities": ["Furnished", "Pool", "Gym", "Security System", "In-unit Laundry"]
        },
        {
            "title": "Sterling Highlander",
            "description": "Premium student housing with private bedrooms, upgraded finishes, and extensive community amenities.",
            "address": "3080 Iowa Ave, Riverside, CA 92507",
            "price": 1350,
            "bedrooms": 1,
            "bathrooms": 1.0,
            "square_feet": 600,
            "property_type": "Apartment",
            "amenities": ["Pool", "Gym", "Furnished", "Security System"]
        },
        {
            "title": "The Palms on University",
            "description": "Budget-friendly apartments close to campus with utilities included and flexible lease terms.",
            "address": "1225 University Ave, Riverside, CA 92507",
            "price": 975,
            "bedrooms": 1,
            "bathrooms": 1.0,
            "square_feet": 550,
            "property_type": "Apartment",
            "amenities": ["Parking", "Air Conditioning", "Heating"]
        },
        {
            "title": "Riverside House",
            "description": "Classic house rental with yard, perfect for students sharing. Walking distance to campus and shopping.",
            "address": "1050 W Linden St, Riverside, CA 92507",
            "price": 2200,
            "bedrooms": 3,
            "bathrooms": 2.0,
            "square_feet": 1400,
            "property_type": "House",
            "amenities": ["Parking", "Pet Friendly", "In-unit Laundry"]
        },
        {
            "title": "Canyon Crest Villas",
            "description": "Upscale apartments in the desirable Canyon Crest neighborhood with mountain views and quiet surroundings.",
            "address": "5100 Canyon Crest Dr, Riverside, CA 92507",
            "price": 1650,
            "bedrooms": 2,
            "bathrooms": 2.0,
            "square_feet": 950,
            "property_type": "Apartment",
            "amenities": ["Pool", "Balcony", "Dishwasher", "In-unit Laundry", "Parking"]
        },
        {
            "title": "Bannockburn Village",
            "description": "UCR-affiliated housing offering studio to 4-bedroom apartments with academic-year leases.",
            "address": "3637 Canyon Crest Dr, Riverside, CA 92507",
            "price": 1100,
            "bedrooms": 1,
            "bathrooms": 1.0,
            "square_feet": 500,
            "property_type": "Apartment",
            "amenities": ["Furnished", "Air Conditioning", "Heating"]
        }
    ]

def fetch_from_zillow_api():
    """
    Fetch real data from Zillow via RapidAPI with pagination and error handling,
    focusing specifically on properties within 2 miles of UCR campus
    """
    # Get API key from environment or config
    api_key = os.environ.get("RAPIDAPI_KEY")
    if not api_key:
        logger.warning("No RapidAPI key found. Skipping Zillow API fetch.")
        return []
    
    # We'll store all property listings here
    all_listings = []
    
    # Try different search strategies to ensure we get good coverage within 2 miles
    # Strategy 1: Search by ZIP codes near UCR
    for zip_code in UCR_ZIP_CODES:
        logger.info(f"Fetching properties for ZIP code {zip_code}...")
        
        url = "https://zillow-com1.p.rapidapi.com/propertyExtendedSearch"
        querystring = {
            "location": f"Riverside, CA {zip_code}",
            "home_type": "Apartments,Houses,Condos,Townhomes",
            "page": "1"
        }
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com"
        }
        
        # Pagination tracking
        current_page = 1
        has_more_pages = True
        
        # Process listings for this ZIP code with pagination
        while has_more_pages and current_page <= 5:  # Limit to 5 pages to avoid rate limits
            querystring["page"] = str(current_page)
            
            # Implement exponential backoff retry logic
            for attempt in range(MAX_RETRIES):
                try:
                    logger.info(f"Fetching page {current_page} for ZIP {zip_code} (attempt {attempt+1})")
                    response = requests.get(url, headers=headers, params=querystring, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    # Extract properties from the response
                    properties = data.get("props", [])
                    logger.info(f"Retrieved {len(properties)} properties from ZIP {zip_code}, page {current_page}")
                    
                    # Transform properties to our format
                    transformed_listings = transform_zillow_listings(properties)
                    all_listings.extend(transformed_listings)
                    
                    # Check if we have more pages
                    has_more_pages = data.get("hasMorePages", False)
                    
                    # Success! Break out of retry loop
                    break
                    
                except requests.exceptions.HTTPError as e:
                    if e.response.status_code == 429:  # Rate limit error
                        if attempt < MAX_RETRIES - 1:
                            wait_time = (2 ** attempt) * 2  # Exponential backoff: 2, 4, 8 seconds
                            logger.warning(f"Rate limit hit. Waiting {wait_time} seconds before retry.")
                            time.sleep(wait_time)
                        else:
                            logger.error(f"Rate limit persisted after {MAX_RETRIES} attempts. Skipping.")
                            has_more_pages = False
                            break
                    else:
                        logger.error(f"HTTP error: {e}")
                        has_more_pages = False
                        break
                        
                except Exception as e:
                    logger.error(f"Error fetching from Zillow API: {str(e)}")
                    has_more_pages = False
                    break
            
            # Move to next page if more are available
            if has_more_pages:
                current_page += 1
                # Add a delay between pages to avoid rate limiting
                time.sleep(2)
        
        # Add a delay between ZIP codes to avoid rate limiting
        if zip_code != UCR_ZIP_CODES[-1]:
            time.sleep(5)
    
    # Strategy 2: Search specifically for UCR area with direct proximity
    try:
        logger.info("Fetching properties with direct UCR proximity search...")
        
        url = "https://zillow-com1.p.rapidapi.com/propertyExtendedSearch"
        querystring = {
            "location": "University of California Riverside",
            "home_type": "Apartments,Houses,Condos,Townhomes",
            "page": "1"
        }
        
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract properties from the response
        properties = data.get("props", [])
        logger.info(f"Retrieved {len(properties)} properties from UCR direct search")
        
        # Transform properties to our format
        transformed_listings = transform_zillow_listings(properties)
        
        # Add to our results, preventing duplicates by address check
        existing_addresses = {listing.get("address", "").lower() for listing in all_listings}
        for listing in transformed_listings:
            if listing.get("address", "").lower() not in existing_addresses:
                all_listings.append(listing)
                existing_addresses.add(listing.get("address", "").lower())
    
    except Exception as e:
        logger.error(f"Error during UCR direct search: {str(e)}")
    
    # Strategy 3: Search for specific UCR-adjacent neighborhoods
    ucr_areas = [
        "Canyon Crest Riverside",
        "University Village Riverside",
        "Bannockburn Riverside",
        "University Neighborhood Riverside"
    ]
    
    for area in ucr_areas:
        try:
            logger.info(f"Fetching properties in {area}...")
            
            url = "https://zillow-com1.p.rapidapi.com/propertyExtendedSearch"
            querystring = {
                "location": area,
                "home_type": "Apartments,Houses,Condos,Townhomes",
                "page": "1"
            }
            
            response = requests.get(url, headers=headers, params=querystring, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Extract properties from the response
            properties = data.get("props", [])
            logger.info(f"Retrieved {len(properties)} properties from {area}")
            
            # Transform properties to our format
            transformed_listings = transform_zillow_listings(properties)
            
            # Add to our results, preventing duplicates by address check
            existing_addresses = {listing.get("address", "").lower() for listing in all_listings}
            for listing in transformed_listings:
                if listing.get("address", "").lower() not in existing_addresses:
                    all_listings.append(listing)
                    existing_addresses.add(listing.get("address", "").lower())
        
        except Exception as e:
            logger.error(f"Error during {area} search: {str(e)}")
    
    # Log final count
    logger.info(f"Total Zillow listings fetched: {len(all_listings)}")
    return all_listings

def transform_zillow_listings(properties):
    """
    Transform Zillow API property format to our application's format,
    with enhanced filtering for UCR proximity
    """
    transformed = []
    skipped_count = 0
    
    for prop in properties:
        # Skip properties that are too far from UCR immediately
        if is_too_far_from_ucr(prop):
            skipped_count += 1
            continue
            
        # Parse price (remove $ and commas)
        price = 0
        price_text = prop.get("price", "")
        if isinstance(price_text, str):
            price_text = price_text.replace("$", "").replace(",", "").strip()
            try:
                price = int(float(price_text))
            except (ValueError, TypeError):
                # Try to extract numbers from the string
                numbers = re.findall(r'\d+', price_text)
                if numbers:
                    try:
                        price = int(numbers[0])
                    except (ValueError, IndexError):
                        price = 0
        
        # Skip unreasonable prices
        if price <= 100 or price > MAX_PRICE:
            continue
        
        # Get address components
        address_obj = prop.get("address", {})
        street = address_obj.get("streetAddress", "")
        city = address_obj.get("city", "Riverside")
        state = address_obj.get("state", "CA")
        zipcode = address_obj.get("zipcode", "")
        
        # Skip if no street address
        if not street:
            continue
            
        # Format full address
        address = f"{street}, {city}, {state} {zipcode}".strip()
        
        # Extract bedrooms and bathrooms
        bedrooms = prop.get("bedrooms", 0)
        bathrooms = prop.get("bathrooms", 0)
        
        # Handle bedrooms/bathrooms in unexpected formats
        if isinstance(bedrooms, str):
            try:
                bedrooms = int(float(bedrooms.split()[0]))
            except (ValueError, IndexError):
                bedrooms = 0
                
        if isinstance(bathrooms, str):
            try:
                bathrooms = float(bathrooms.split()[0])
            except (ValueError, IndexError):
                bathrooms = 0
        
        # Detect property type
        property_type = "Apartment"
        if "house" in prop.get("propertyType", "").lower():
            property_type = "House"
        elif "condo" in prop.get("propertyType", "").lower():
            property_type = "Condo"
        elif "townhouse" in prop.get("propertyType", "").lower() or "town house" in prop.get("propertyType", "").lower():
            property_type = "Townhouse"
        
        # Create description with available information
        description_parts = []
        
        # Add Zillow listing URL if available for reference
        if prop.get("detailUrl"):
            # Don't include the URL directly in description to avoid scraping issues
            # Just note it's from Zillow
            description_parts.append("Listing information from Zillow.")
        
        if prop.get("yearBuilt"):
            description_parts.append(f"Built in {prop.get('yearBuilt')}.")
        if prop.get("livingArea"):
            description_parts.append(f"Living area of {prop.get('livingArea')} sq ft.")
        if prop.get("lotSize"):
            description_parts.append(f"Lot size of {prop.get('lotSize')}.")
        
        # Include original description if available
        if prop.get("description") and isinstance(prop.get("description"), str):
            # Clean up and truncate if too long
            orig_desc = prop.get("description").strip()
            if len(orig_desc) > 500:
                orig_desc = orig_desc[:497] + "..."
            description_parts.append(orig_desc)
            
        # Calculate distance from UCR if coordinates available
        if prop.get("latitude") and prop.get("longitude"):
            try:
                distance = calculate_distance_from_ucr(float(prop["latitude"]), float(prop["longitude"]))
                description_parts.append(f"Located {distance:.1f} miles from UCR campus.")
            except:
                pass
            
        # Add default description if nothing is available
        if not description_parts:
            description_parts.append(f"Great {property_type.lower()} near UCR campus.")
            
        # Combine the description parts
        description = " ".join(description_parts)
        
        # Extract amenities from various sources
        amenities = []
        
        # From description
        desc_amenities = extract_amenities_from_text(description)
        amenities.extend(desc_amenities)
        
        # From features/facts list if available
        if prop.get("facts") and isinstance(prop.get("facts"), list):
            for fact in prop.get("facts"):
                if isinstance(fact, str):
                    fact_amenities = extract_amenities_from_text(fact)
                    amenities.extend(fact_amenities)
        
        # Remove duplicates
        amenities = list(set(amenities))
        
        # Generate a more descriptive title
        title_parts = []
        title_parts.append(f"{bedrooms}-Bed")
        if bathrooms > 0:
            title_parts.append(f"{bathrooms}-Bath")
        title_parts.append(property_type)
        
        # Add neighborhood if available
        if prop.get("brokerName") and "near UCR" not in prop.get("brokerName"):
            title_parts.append(f"by {prop.get('brokerName')}")
        else:
            title_parts.append(f"near UCR")
            
        title = " ".join(title_parts)
        
        # Extract images if available (for future use)
        images = []
        if prop.get("imgSrc"):
            images.append(prop.get("imgSrc"))
        
        # Create the transformed listing
        listing = {
            "title": title,
            "description": description,
            "address": address,
            "price": price,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "square_feet": prop.get("livingArea", 0),
            "property_type": property_type,
            "latitude": prop.get("latitude", None),
            "longitude": prop.get("longitude", None),
            "contact_email": "contact@example.com",  # Default since Zillow doesn't provide this
            "amenities": amenities
        }
        
        transformed.append(listing)
    
    logger.info(f"Transformed {len(transformed)} listings, skipped {skipped_count} outside 2-mile radius")
    return transformed

def is_too_far_from_ucr(prop):
    """Check if a property is too far from UCR campus using Haversine formula"""
    # Skip if no lat/long
    if not prop.get("latitude") or not prop.get("longitude"):
        return False  # We'll geocode it later
        
    # Calculate distance from UCR
    try:
        from math import radians, sin, cos, sqrt, atan2
        
        lat1, lon1 = radians(UCR_LAT), radians(UCR_LNG)
        lat2, lon2 = radians(float(prop["latitude"])), radians(float(prop["longitude"]))
        
        # Haversine formula for precise distance calculation
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance_miles = 3959 * c  # Radius of Earth in miles
        
        # Strictly enforce 2-mile radius
        logger.debug(f"Property at coordinates ({prop.get('latitude')}, {prop.get('longitude')}) is {distance_miles:.2f} miles from UCR")
        return distance_miles > MAX_DISTANCE_MILES
    except Exception as e:
        logger.error(f"Error calculating distance: {str(e)}")
        return False  # If we can't calculate, default to including it for now

def calculate_distance_from_ucr(lat, lng):
    """Calculate distance in miles from UCR campus using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    
    # Convert coordinates to radians
    lat1, lon1 = radians(UCR_LAT), radians(UCR_LNG)
    lat2, lon2 = radians(float(lat)), radians(float(lng))
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance_miles = 3959 * c  # Earth radius in miles
    
    return distance_miles

def extract_amenities_from_text(text):
    """
    Extract potential amenities from property text using keyword matching.
    Handles various ways amenities might be described in property listings.
    """
    if not text or not isinstance(text, str):
        return []
        
    text = text.lower()
    amenities = []
    
    # Common amenity keywords with their standardized names
    amenity_keywords = {
        # Parking-related
        "parking": "Parking",
        "garage": "Parking",
        "carport": "Parking",
        "covered parking": "Parking",
        "assigned parking": "Assigned Parking",
        "reserved parking": "Assigned Parking",
        
        # Laundry-related
        "laundry": "In-unit Laundry",
        "washer": "In-unit Laundry",
        "dryer": "In-unit Laundry",
        "w/d": "In-unit Laundry",
        "washer/dryer": "In-unit Laundry",
        "laundry facility": "Laundry Facility",
        "laundry on site": "Laundry Facility",
        "laundry room": "Laundry Facility",
        
        # Kitchen appliances
        "dishwasher": "Dishwasher",
        "refrigerator": "Refrigerator",
        "fridge": "Refrigerator",
        "stove": "Stove",
        "oven": "Oven",
        "microwave": "Microwave",
        "disposal": "Garbage Disposal",
        "garbage disposal": "Garbage Disposal",
        
        # Climate control
        "air conditioning": "Air Conditioning",
        "ac ": "Air Conditioning",
        "a/c": "Air Conditioning",
        "central air": "Air Conditioning",
        "central a/c": "Air Conditioning",
        "heating": "Heating",
        "heater": "Heating",
        "central heat": "Heating",
        "hvac": "HVAC",
        "ceiling fan": "Ceiling Fans",
        "fans": "Ceiling Fans",
        
        # Furnishing
        "furnished": "Furnished",
        "fully furnished": "Fully Furnished",
        "partially furnished": "Partially Furnished",
        "furniture": "Furnished",
        
        # Recreation
        "pool": "Pool",
        "swimming pool": "Pool",
        "gym": "Gym",
        "fitness": "Gym",
        "fitness center": "Gym",
        "workout": "Gym",
        "exercise": "Gym",
        "basketball": "Basketball Court",
        "tennis": "Tennis Court",
        "volleyball": "Volleyball Court",
        "playground": "Playground",
        "bbq": "BBQ Area",
        "grill": "BBQ Area",
        "picnic": "Picnic Area",
        "clubhouse": "Clubhouse",
        "club house": "Clubhouse",
        "community room": "Community Room",
        "game room": "Game Room",
        
        # Pets
        "pet": "Pet Friendly",
        "dog": "Pet Friendly",
        "cat": "Pet Friendly",
        "dogs allowed": "Pet Friendly",
        "cats allowed": "Pet Friendly",
        "pet friendly": "Pet Friendly",
        "pet policy": "Pet Friendly",
        "pet fee": "Pet Friendly",
        
        # Outdoor space
        "balcony": "Balcony",
        "patio": "Patio",
        "deck": "Deck",
        "yard": "Private Yard",
        "private yard": "Private Yard",
        "garden": "Garden",
        "outdoor space": "Outdoor Space",
        
        # Security
        "security": "Security System",
        "alarm": "Security System",
        "gated": "Gated Community",
        "controlled access": "Controlled Access",
        "entry system": "Controlled Access",
        "intercom": "Intercom",
        "doorman": "Doorman",
        "on-site manager": "On-site Manager",
        "on site manager": "On-site Manager",
        "property manager": "On-site Manager",
        
        # Accessibility
        "elevator": "Elevator",
        "lift": "Elevator",
        "wheelchair": "Wheelchair Accessible",
        "accessible": "Wheelchair Accessible",
        "ada": "ADA Compliant",
        
        # Other amenities
        "walk-in closet": "Walk-in Closet",
        "walk in closet": "Walk-in Closet",
        "storage": "Storage",
        "hardwood": "Hardwood Floors",
        "wood floor": "Hardwood Floors",
        "carpet": "Carpet",
        "tile": "Tile Floors",
        "granite": "Granite Countertops",
        "quartz": "Quartz Countertops",
        "stainless": "Stainless Steel Appliances",
        "fireplace": "Fireplace",
        "high ceiling": "High Ceilings",
        "vaulted ceiling": "High Ceilings",
        "skylight": "Skylights",
        "view": "Great Views",
        "mountain view": "Mountain View",
        "water view": "Water View",
        "city view": "City View",
        
        # Utilities and services
        "utilities included": "Utilities Included",
        "water included": "Water Included",
        "trash included": "Trash Included",
        "sewer included": "Sewer Included",
        "gas included": "Gas Included",
        "electricity included": "Electricity Included",
        "internet": "Internet Available",
        "wifi": "Internet Available",
        "cable": "Cable Ready",
        "satellite": "Satellite Ready",
        
        # Student specific
        "student housing": "Student Housing",
        "near ucr": "Near UCR",
        "ucr shuttle": "UCR Shuttle",
        "campus shuttle": "Campus Shuttle",
        "study room": "Study Room",
        "computer lab": "Computer Lab"
    }
    
    # First, check for explicit amenity listings like "Amenities include: X, Y, Z"
    amenity_sections = []
    for marker in ["amenities include", "amenities:", "features include", "features:", "property features"]:
        if marker in text:
            try:
                # Extract section after marker
                section = text.split(marker)[1].split(".")[0]
                amenity_sections.append(section)
            except:
                pass
    
    # Process explicit amenity sections first (higher confidence)
    for section in amenity_sections:
        # Split by commas and common separators
        items = re.split(r'[,;•|+]', section)
        for item in items:
            item = item.strip().lower()
            # Direct match against our standardized amenities
            for std_amenity in set(amenity_keywords.values()):
                if std_amenity.lower() == item:
                    amenities.append(std_amenity)
                    break
    
    # Then do keyword matching on the full text
    for keyword, amenity in amenity_keywords.items():
        if keyword in text and amenity not in amenities:
            amenities.append(amenity)
    
    # Post-process: enforce some logical rules
    # If both in-unit laundry and laundry facility, prefer in-unit
    if "In-unit Laundry" in amenities and "Laundry Facility" in amenities:
        amenities.remove("Laundry Facility")
        
    # If conflicting information about furnishing, prefer more specific
    if "Fully Furnished" in amenities and "Partially Furnished" in amenities:
        amenities.remove("Partially Furnished")
    if "Fully Furnished" in amenities and "Furnished" in amenities:
        amenities.remove("Furnished")
    if "Partially Furnished" in amenities and "Furnished" in amenities:
        amenities.remove("Furnished")
    
    return amenities

def geocode_address(address):
    """
    Use a geocoding service to get latitude and longitude for an address
    This example uses the free Nominatim service, but has usage limits
    For production, consider using Google Maps API or another service
    """
    try:
        # Adding a user-agent is required by Nominatim's ToS
        headers = {
            "User-Agent": "HousingConnectApp/1.0"
        }
        
        # URL-encode the address
        encoded_address = quote_plus(address)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_address}&format=json&limit=1"
        
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return lat, lon
        else:
            # If no results, return coordinates slightly offset from UCR
            # This ensures the listing shows up on the map
            random_lat = UCR_LAT + (random.random() - 0.5) * 0.01
            random_lng = UCR_LNG + (random.random() - 0.5) * 0.01
            return random_lat, random_lng
    except Exception as e:
        logger.error(f"Error geocoding address: {str(e)}")
        # Return default coordinates with small random offset
        random_lat = UCR_LAT + (random.random() - 0.5) * 0.01
        random_lng = UCR_LNG + (random.random() - 0.5) * 0.01
        return random_lat, random_lng

def import_listings(listings_data, amenities_dict):
    """Import listings into the database"""
    listings_added = 0
    duplicates_found = 0
    too_far_count = 0
    
    for listing_data in listings_data:
        # Check if listing already exists
        address = listing_data.get("address", "").strip()
        bedrooms = listing_data.get("bedrooms", 0)
        
        if not address:
            continue
            
        # Normalize address for better matching
        normalized_address = normalize_address(address)
        
        existing = db.session.query(Listing).filter(
            # Use the normalized address for matching
            db.func.lower(Listing.address).like(f"%{normalized_address}%")
        ).filter(
            Listing.bedrooms == bedrooms
        ).first()
        
        if existing:
            logger.debug(f"Listing already exists: {listing_data.get('title', 'Untitled')}")
            duplicates_found += 1
            continue
        
        # Extract amenity names and find corresponding objects
        amenity_names = listing_data.pop("amenities", [])
        amenity_objects = [amenities_dict[name] for name in amenity_names if name in amenities_dict]
        
        # Geocode address if lat/lng not provided
        if "latitude" not in listing_data or "longitude" not in listing_data or not listing_data["latitude"]:
            lat, lng = geocode_address(address)
            listing_data["latitude"] = lat
            listing_data["longitude"] = lng
            # Add a short delay to avoid overwhelming the geocoding service
            time.sleep(0.25)
        
        # Check if the property is within 2 miles of UCR campus
        distance = calculate_distance_from_ucr(listing_data["latitude"], listing_data["longitude"])
        if distance > MAX_DISTANCE_MILES:
            logger.info(f"Skipping listing at {address} - {distance:.2f} miles from UCR (outside 2-mile radius)")
            too_far_count += 1
            continue
            
        # Store the distance in the description for reference
        if listing_data.get("description"):
            listing_data["description"] += f" Located {distance:.1f} miles from UCR campus."
        else:
            listing_data["description"] = f"Located {distance:.1f} miles from UCR campus."
        
        # Set available date if not provided
        if "available_date" not in listing_data:
            days = random.randint(0, 30)
            listing_data["available_date"] = datetime.now() + timedelta(days=days)
        
        # Ensure required fields
        if "contact_email" not in listing_data:
            listing_data["contact_email"] = "contact@example.com"
        
        # Create listing
        listing = Listing(**listing_data)
        
        # Add amenities
        listing.amenities.extend(amenity_objects)
        
        db.session.add(listing)
        listings_added += 1
        
        # Commit in batches to avoid large transactions
        if listings_added % 10 == 0:
            try:
                db.session.commit()
                logger.info(f"Committed batch of 10 listings. Total so far: {listings_added}")
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error committing batch: {str(e)}")
    
    # Commit any remaining listings
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in final commit: {str(e)}")
    
    logger.info(f"Import summary: Added {listings_added} new listings, found {duplicates_found} duplicates, {too_far_count} outside range")
    return listings_added

def normalize_address(address):
    """Normalize address for better matching to avoid duplicates"""
    address = address.lower()
    # Replace common abbreviations
    replacements = {
        "avenue": "ave",
        "street": "st",
        "boulevard": "blvd",
        "drive": "dr",
        "lane": "ln",
        "road": "rd",
        "place": "pl",
        "court": "ct",
        "circle": "cir",
        "apartment": "apt",
        "suite": "ste",
        "unit": "#",
        "#": "",
        ",": "",
    }
    
    for full, abbr in replacements.items():
        address = address.replace(full, abbr)
    
    # Remove common non-essential components
    address = ' '.join(word for word in address.split() if word not in ["riverside", "ca", "california"])
    
    return address.strip()

def import_from_csv(filepath, amenities_dict):
    """Import listings from a CSV file"""
    if not os.path.exists(filepath):
        logger.error(f"CSV file not found: {filepath}")
        return 0
    
    logger.info(f"Importing listings from CSV: {filepath}")
    csv_listings = []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Validate that required columns exist
            required_fields = ["title", "address", "price", "bedrooms"]
            for field in required_fields:
                if field not in reader.fieldnames:
                    logger.error(f"CSV is missing required field: {field}")
                    return 0
            
            for row in reader:
                listing = {
                    "title": row.get("title", "").strip(),
                    "description": row.get("description", "").strip(),
                    "address": row.get("address", "").strip(),
                    "bedrooms": parse_int(row.get("bedrooms", 0)),
                    "bathrooms": parse_float(row.get("bathrooms", 0)),
                    "price": parse_int(row.get("price", 0)),
                    "square_feet": parse_int(row.get("square_feet", 0)),
                    "property_type": row.get("property_type", "Apartment").strip(),
                    "contact_email": row.get("contact_email", "contact@example.com").strip(),
                    "contact_phone": row.get("contact_phone", "").strip(),
                }
                
                # Parse amenities if present
                if "amenities" in row and row["amenities"]:
                    # Amenities might be comma-separated list
                    amenities = [a.strip() for a in row["amenities"].split(",")]
                    listing["amenities"] = amenities
                else:
                    listing["amenities"] = []
                
                # Add to listings if all required fields are non-empty
                if listing["title"] and listing["address"] and listing["price"] > 0:
                    csv_listings.append(listing)
    
    except Exception as e:
        logger.error(f"Error reading CSV file: {str(e)}")
        return 0
    
    logger.info(f"Found {len(csv_listings)} listings in CSV file")
    
    # Import the CSV listings
    return import_listings(csv_listings, amenities_dict)

def parse_int(value):
    """Safely parse an integer from a string or other value"""
    if isinstance(value, int):
        return value
        
    try:
        # Remove any currency symbols or commas
        if isinstance(value, str):
            value = value.replace('$', '').replace(',', '').strip()
        return int(float(value))
    except (ValueError, TypeError):
        return 0

def parse_float(value):
    """Safely parse a float from a string or other value"""
    if isinstance(value, float):
        return value
        
    try:
        if isinstance(value, str):
            value = value.replace('$', '').replace(',', '').strip()
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def main():
    """Main function to import housing data"""
    # Check for CSV import argument
    csv_file = None
    zip_codes = UCR_ZIP_CODES.copy()
    
    # Process command-line arguments
    if len(sys.argv) > 1:
        if sys.argv[1].endswith('.csv'):
            csv_file = sys.argv[1]
        elif sys.argv[1] in ['--help', '-h']:
            print("Usage: python import_housing_data.py [csv_file.csv] [zip1,zip2,...]")
            print("  - Specify a CSV file to import listings from that file")
            print("  - Specify zip codes to limit Zillow API searches")
            print("  - No arguments will use default settings")
            return
        if len(sys.argv) > 2 and ',' in sys.argv[2]:
            zip_codes = sys.argv[2].split(',')
    
    app = create_app()
    with app.app_context():
        # Get all amenities
        amenities = Amenity.query.all()
        if not amenities:
            logger.error("No amenities found. Please run seed_data.py first.")
            return
        
        # Create a dictionary of amenity objects by name
        amenities_dict = {a.name: a for a in amenities}
        
        listings_added = 0
        
        # Import from CSV if specified
        if csv_file:
            csv_count = import_from_csv(csv_file, amenities_dict)
            logger.info(f"Imported {csv_count} listings from CSV file")
            listings_added += csv_count
        
        # Import from Zillow API
        logger.info("Fetching from Zillow API...")
        zillow_data = fetch_from_zillow_api()
        
        # Import sample data if Zillow didn't return anything
        if not zillow_data:
            logger.info("No data from Zillow API. Using sample data instead.")
            sample_data = get_sample_data()
            zillow_data = sample_data
        
        # Import the listings from Zillow/sample data
        logger.info(f"Importing {len(zillow_data)} listings...")
        zillow_count = import_listings(zillow_data, amenities_dict)
        listings_added += zillow_count
        
        logger.info(f"Successfully imported {listings_added} total new listings.")
        
        # Create import log entry
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'housing_updates.log')
        with open(log_path, 'a') as f:
            f.write(f"Housing data update complete at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Added {listings_added} listings\n")

if __name__ == "__main__":
    main() 