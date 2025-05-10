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

def create_openai_client(api_key=None):
    """
    Create an OpenAI client instance with minimal configuration following 
    the OpenAI documentation's recommended approach.
    
    Args:
        api_key (str): The OpenAI API key to use
        
    Returns:
        OpenAI: A configured OpenAI client instance
    """
    # Import here to avoid unnecessary dependencies if this function isn't used
    from openai import OpenAI
    import os
    
    # If no API key is provided, try to get it from environment variables
    if not api_key:
        api_key = os.environ.get('OPENAI_API_KEY')
        
    if not api_key:
        raise ValueError("No OpenAI API key provided")
    
    # Temporarily disable any proxy-related environment variables that might interfere
    original_proxies = {}
    for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'no_proxy', 'NO_PROXY']:
        if proxy_var in os.environ:
            original_proxies[proxy_var] = os.environ[proxy_var]
            del os.environ[proxy_var]
    
    try:
        # Following the OpenAI documentation approach with minimal configuration
        os.environ['OPENAI_API_KEY'] = api_key
        client = OpenAI()
        return client
    finally:
        # Restore original proxy settings
        for proxy_var, value in original_proxies.items():
            os.environ[proxy_var] = value
        # Remove our temporary API key setting if we added it
        if 'OPENAI_API_KEY' in os.environ and os.environ['OPENAI_API_KEY'] == api_key:
            del os.environ['OPENAI_API_KEY']
