#!/usr/bin/env python3
"""
Test script to verify that the mock response functionality works correctly
"""
import requests
import json

def test_chat_api():
    """Test the chat API endpoint with different types of queries"""
    url = 'http://localhost:5006/chat/ask'
    headers = {'Content-Type': 'application/json'}
    
    # Test with different queries to verify that mock responses are working
    test_queries = [
        "I need a 1-bedroom apartment near UCR",
        "Looking for a 3-bedroom house with pet-friendly policy under $2000",
        "Need a place with parking and in-unit laundry"
    ]
    
    for query in test_queries:
        data = {'message': query}
        
        print(f"\nTesting query: {query}")
        response = requests.post(url, headers=headers, data=json.dumps(data))
        
        if response.status_code == 200:
            response_data = response.json()
            print("Response message:")
            print(response_data.get('message', 'No message in response')[:200] + "...")
            
            # Check if the mock response includes key phrases based on the query
            mock_response = response_data.get('message', '')
            
            # Check if query-specific terms are reflected in the response
            if "1-bedroom" in query and "1-bedroom" in mock_response.lower():
                print("✅ Mock response correctly processed 1-bedroom request")
            elif "3-bedroom" in query and "3-bedroom" in mock_response.lower():
                print("✅ Mock response correctly processed 3-bedroom request")
            elif "pet-friendly" in query and "pet-friendly" in mock_response.lower():
                print("✅ Mock response understands pet-friendly requirement")
            elif "parking" in query and "parking" in mock_response.lower():
                print("✅ Mock response understands parking requirement")
            elif "laundry" in query and "laundry" in mock_response.lower():
                print("✅ Mock response understands laundry requirement")
            else:
                print("⚠️ Mock response may not be processing query-specific terms")
            
            # Check the suggested listings
            listings = response_data.get('listings', [])
            print(f"Number of suggested listings: {len(listings)}")
            if listings:
                for i, listing in enumerate(listings, 1):
                    print(f"{i}. {listing.get('title')} - ${listing.get('price')}")
        else:
            print(f"Error response: {response.text}")

if __name__ == "__main__":
    test_chat_api() 