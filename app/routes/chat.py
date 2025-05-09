from flask import Blueprint, render_template, request, jsonify, current_app
from app.models import Listing
from app import db
import os
import json
import traceback
import requests
from openai import OpenAI

# Create a blueprint for chat routes
chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

@chat_bp.route('', methods=['GET'])
def chat_interface():
    """Render the chat interface"""
    return render_template('chat/index.html')

@chat_bp.route('/ask', methods=['POST'])
def ask():
    """Process a question from the user and return matching listings"""
    # Get the question from the request
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    user_message = data['message']
    
    # Get all listings from database
    listings = Listing.query.all()
    listings_data = [listing.to_dict() for listing in listings]
    
    # Get the API key from Flask config
    api_key = current_app.config.get('OPENAI_API_KEY')
    
    # Log API key status (masked for security)
    if api_key:
        masked_key = api_key[:4] + '...' + api_key[-4:] if len(api_key) > 8 else '****'
        print(f"Using OpenAI API key: {masked_key}")
    else:
        print("No OpenAI API key found in Flask config")
        # Fall back to mock response if no API key is available
        return use_mock_response(user_message, listings_data)
    
    try:
        # Prepare listing data for the AI context
        safe_listings_data = []
        for listing in listings_data:
            # Create a simplified version with only necessary fields
            safe_listing = {
                'id': listing.get('id'),
                'title': listing.get('title'),
                'description': listing.get('description', ''),
                'address': listing.get('address', ''),
                'price': listing.get('price', 0),
                'bedrooms': listing.get('bedrooms', 0),
                'bathrooms': listing.get('bathrooms', 0),
                'property_type': listing.get('property_type', ''),
                'amenities': listing.get('amenities', [])
            }
            safe_listings_data.append(safe_listing)
        
        # Test the API key by making a simple call to OpenAI
        try:
            # Initialize the OpenAI client properly for the current SDK version
            client = OpenAI(api_key=api_key)
            
            # Create a system prompt with the listings data
            system_prompt = f"""You are a helpful housing assistant for UCR students. 
            Your goal is to help students find suitable off-campus housing based on their requirements.
            Here are the available listings:
            {json.dumps(safe_listings_data, indent=2)}
            
            When suggesting housing options:
            1. Match the student's requirements as closely as possible
            2. Provide specific listings from the data above
            3. Be helpful, friendly, and concise
            4. Only recommend listings from the data provided
            5. Format your response in markdown"""
            
            # Create a chat completion using the OpenAI API
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            # Extract the AI's response
            ai_response = response.choices[0].message.content
            
            # Suggest relevant listings (up to 3) based on the AI's response
            suggested_listings = []
            
            # Extract listing IDs mentioned in the response
            for listing in safe_listings_data:
                # Check if the listing title or ID is mentioned in the response
                if f"**{listing.get('title')}**" in ai_response or f"ID: {listing.get('id')}" in ai_response:
                    # Find the original listing with all fields
                    for full_listing in listings_data:
                        if full_listing.get('id') == listing.get('id'):
                            suggested_listings.append(full_listing)
                            break
                
                # Stop after we've found 3 listings
                if len(suggested_listings) >= 3:
                    break
            
            # If no listings were explicitly mentioned, include the first 3
            if not suggested_listings and listings_data:
                suggested_listings = listings_data[:3]
            
            return jsonify({
                'message': ai_response,
                'listings': suggested_listings
            })
            
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            print("Falling back to mock response")
            return use_mock_response(user_message, listings_data)
    
    except Exception as e:
        # Print full exception details for debugging
        print(f"Error in chat endpoint: {str(e)}")
        print(traceback.format_exc())
        
        # Handle any errors by returning a generic response
        return jsonify({
            'message': f"I'm sorry, I couldn't process that request due to an error: {str(e)}",
            'listings': listings_data[:3] if listings_data else []
        }), 500

def use_mock_response(user_message, listings_data):
    """Helper function to use mock response when OpenAI API is unavailable"""
    print("Using mock AI response due to API quota limitations")
    
    # Prepare listing data for the mock response
    safe_listings_data = []
    for listing in listings_data:
        # Create a simplified version with only necessary fields
        safe_listing = {
            'id': listing.get('id'),
            'title': listing.get('title'),
            'description': listing.get('description', ''),
            'address': listing.get('address', ''),
            'price': listing.get('price', 0),
            'bedrooms': listing.get('bedrooms', 0),
            'bathrooms': listing.get('bathrooms', 0),
            'property_type': listing.get('property_type', ''),
            'amenities': listing.get('amenities', [])
        }
        safe_listings_data.append(safe_listing)
    
    # Generate mock response
    mock_response = generate_mock_response(user_message, safe_listings_data)
    return jsonify({
        'message': mock_response,
        'listings': listings_data[:3] if listings_data else []
    })

def generate_mock_response(query, listings):
    """Generate a mock AI response for development purposes"""
    # Extract some basic info from the query
    bedrooms = 2
    price = 1500
    amenities = []
    
    if "1 bedroom" in query.lower() or "1-bedroom" in query.lower():
        bedrooms = 1
    elif "3 bedroom" in query.lower() or "3-bedroom" in query.lower():
        bedrooms = 3
    
    if "$" in query:
        try:
            price_text = query.split("$")[1].split()[0]
            if price_text.isdigit():
                price = int(price_text)
        except:
            pass
    
    # Look for amenities
    if "parking" in query.lower():
        amenities.append("parking")
    if "pet" in query.lower() or "dog" in query.lower() or "cat" in query.lower():
        amenities.append("pet-friendly")
    if "laundry" in query.lower() or "washer" in query.lower():
        amenities.append("in-unit laundry")
    
    # Find matching listings
    matching_listings = []
    for listing in listings:
        if listing.get('bedrooms') == bedrooms and listing.get('price') <= price * 1.2:
            matching_listings.append(listing)
    
    # If no exact matches, include close matches
    if not matching_listings and listings:
        for listing in listings:
            if abs(listing.get('bedrooms', 0) - bedrooms) <= 1 and listing.get('price', 0) <= price * 1.5:
                matching_listings.append(listing)
    
    # Use the first 1-3 listings from either matching or all listings
    highlighted_listings = matching_listings[:3] if matching_listings else listings[:3] if listings else []
    
    # Create a response
    response = f"Based on your search for a {bedrooms}-bedroom housing with a budget of ${price}, "
    
    if highlighted_listings:
        response += "I found some options that might interest you:\n\n"
        for i, listing in enumerate(highlighted_listings, 1):
            response += f"{i}. **{listing.get('title')}** - ${listing.get('price')} per month\n"
            response += f"   {listing.get('bedrooms')} bed, {listing.get('bathrooms')} bath {listing.get('property_type')}\n"
            response += f"   Located at: {listing.get('address')}\n"
            if listing.get('description'):
                response += f"   {listing.get('description')[:100]}...\n"
            response += "\n"
    else:
        response += "I couldn't find exact matches for your criteria. Please try adjusting your search parameters or check back later for new listings."
    
    return response
