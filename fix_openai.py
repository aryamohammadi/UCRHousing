#!/usr/bin/env python3
"""
Test script to directly test OpenAI API initialization
"""
import os
import sys
import traceback

def test_openai_initialization():
    """
    Test various methods of initializing the OpenAI client to find one that works
    """
    # Get the API key from environment or .env file
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("Error: No OpenAI API key found in environment variables.")
        sys.exit(1)
        
    print(f"Using OpenAI API key starting with: {api_key[:4]}...")
    
    # Method 1: Direct initialization with API key in constructor
    print("\nMethod 1: Direct initialization with API key in constructor")
    try:
        from openai import OpenAI
        client1 = OpenAI(api_key=api_key)
        print("Initialization successful!")
        
        # Test a simple API call
        response = client1.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ],
            max_tokens=10
        )
        print(f"Response: {response.choices[0].message.content}")
        print("Method 1 successful!")
    except Exception as e:
        print(f"Method 1 failed: {str(e)}")
        traceback.print_exc()
    
    # Method 2: Set API key as environment variable
    print("\nMethod 2: Set API key as environment variable")
    try:
        # Set environment variable
        saved_key = os.environ.get('OPENAI_API_KEY')
        os.environ['OPENAI_API_KEY'] = api_key
        
        from openai import OpenAI
        client2 = OpenAI()  # No arguments
        print("Initialization successful!")
        
        # Test a simple API call
        response = client2.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ],
            max_tokens=10
        )
        print(f"Response: {response.choices[0].message.content}")
        print("Method 2 successful!")
        
        # Restore environment
        if saved_key:
            os.environ['OPENAI_API_KEY'] = saved_key
    except Exception as e:
        print(f"Method 2 failed: {str(e)}")
        traceback.print_exc()
        
        # Restore environment in case of error
        if saved_key:
            os.environ['OPENAI_API_KEY'] = saved_key
    
    # Method 3: Using environment variable with proxy variables removed
    print("\nMethod 3: Using environment variable with proxy variables removed")
    try:
        # Remove all proxy environment variables
        original_proxies = {}
        for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'no_proxy', 'NO_PROXY']:
            if proxy_var in os.environ:
                original_proxies[proxy_var] = os.environ[proxy_var]
                del os.environ[proxy_var]
        
        # Set environment variable
        saved_key = os.environ.get('OPENAI_API_KEY')
        os.environ['OPENAI_API_KEY'] = api_key
        
        from openai import OpenAI
        client3 = OpenAI()  # No arguments
        print("Initialization successful!")
        
        # Test a simple API call
        response = client3.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ],
            max_tokens=10
        )
        print(f"Response: {response.choices[0].message.content}")
        print("Method 3 successful!")
    except Exception as e:
        print(f"Method 3 failed: {str(e)}")
        traceback.print_exc()
    finally:
        # Restore proxy environment variables
        for proxy_var, value in original_proxies.items():
            os.environ[proxy_var] = value
            
        # Restore API key
        if saved_key:
            os.environ['OPENAI_API_KEY'] = saved_key

if __name__ == "__main__":
    test_openai_initialization() 