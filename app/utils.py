import requests
import os
import logging
from urllib.parse import quote

# Set up logging
logger = logging.getLogger(__name__)

def geocode_address(address):
    """
    Convert an address string into latitude and longitude coordinates.
    Uses OpenStreetMap's Nominatim API by default.
    
    Args:
        address (str): The address to geocode
        
    Returns:
        tuple: (latitude, longitude) or (None, None) if geocoding fails
    """
    # Ensure address is properly quoted for URL
    encoded_address = quote(address)
    
    # Try to geocode using Nominatim (OpenStreetMap)
    try:
        # Add Riverside, CA to the query to improve results for UCR area
        if "riverside" not in address.lower() and "ca" not in address.lower():
            encoded_address = quote(f"{address}, Riverside, CA")
            
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_address}&format=json&limit=1"
        
        # Add a custom user agent as required by Nominatim's terms
        headers = {
            "User-Agent": "UCRHousingConnect/1.0"
        }
        
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if data and len(data) > 0:
            latitude = float(data[0]["lat"])
            longitude = float(data[0]["lon"])
            logger.info(f"Geocoded {address} to {latitude}, {longitude}")
            return latitude, longitude
        else:
            logger.warning(f"Could not geocode address: {address}")
            return None, None
            
    except Exception as e:
        logger.error(f"Error geocoding address: {str(e)}")
        return None, None
