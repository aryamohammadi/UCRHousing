from flask import Blueprint, render_template, request, jsonify
from app.models import Listing
from app import db
import openai
import os
import json

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
    
    # Don't proceed if no API key is configured
    if not os.environ.get('OPENAI_API_KEY'):
        return jsonify({
            'message': 'ChatGPT integration is not configured. Please set the OPENAI_API_KEY environment variable.',
            'listings': listings_data[:3]  # Return some default listings
        })
    
    try:
        # Create the system message with context about our application
        system_message = """
        You are a helpful assistant for UCR HousingConnect, a platform that helps UCR students find 
        off-campus housing. Your task is to understand what kind of housing the user is looking for
        and match them with appropriate listings from our database.
        
        Extract the following preferences from the user's query:
        - Budget/price range
        - Number of bedrooms
        - Number of bathrooms
        - Property type (house, apartment, room)
        - Desired amenities
        - Location preferences (near campus, specific neighborhood)
        
        Then provide a helpful response that highlights 1-3 listings that best match their criteria.
        """
        
        # Create the message for OpenAI
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": f"User query: {user_message}\n\nAvailable listings: {json.dumps(listings_data)}"}
        ]
        
        # Call the OpenAI API
        client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500
        )
        
        # Extract the response text
        assistant_message = response.choices[0].message.content
        
        # Find listings that match the criteria extracted by ChatGPT
        # For now, we'll return a simple response with the top 3 listings
        # In a more advanced implementation, this would use the extracted preferences to filter
        return jsonify({
            'message': assistant_message,
            'listings': listings_data[:3] if listings_data else []
        })
    
    except Exception as e:
        # Handle any errors from the API call
        return jsonify({
            'message': f"I'm sorry, I couldn't process that request. Error: {str(e)}",
            'listings': []
        }), 500
