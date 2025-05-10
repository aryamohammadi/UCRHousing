import requests
import json

# Test the chat API endpoint
def test_chat_api():
    url = 'http://localhost:5006/chat/ask'
    headers = {'Content-Type': 'application/json'}
    data = {'message': 'I need a 3-bedroom house with a pet-friendly policy near UCR campus for under $2000'}
    
    print(f"Sending POST request to {url}")
    print(f"Request data: {data}")
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        response_data = response.json()
        print("\nResponse message:")
        print(response_data.get('message', 'No message in response'))
        
        print("\nSuggested listings:")
        listings = response_data.get('listings', [])
        if listings:
            for i, listing in enumerate(listings, 1):
                print(f"{i}. {listing.get('title')} - ${listing.get('price')}")
        else:
            print("No listings suggested")
    else:
        print(f"Error response: {response.text}")

if __name__ == '__main__':
    test_chat_api() 