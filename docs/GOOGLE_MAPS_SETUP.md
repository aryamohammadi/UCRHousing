# Google Maps Integration Setup Guide

This guide will help you set up Google Maps integration for the UCR HousingConnect application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A billing account set up in GCP
3. Basic knowledge of GCP services

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "UCR HousingConnect")
5. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Geocoding API

## Step 3: Create API Credentials

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. Click "Edit" on the API key
5. Under "Application restrictions", select "HTTP referrers"
6. Add your domain(s) to the allowed referrers:
   - `localhost/*` (for development)
   - `your-production-domain.com/*`
7. Under "API restrictions", select "Restrict key"
8. Select the APIs you enabled in Step 2
9. Click "Save"

## Step 4: Configure Environment Variables

1. Add the API key to your `.env` file:

   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Make sure the key is loaded in your Flask configuration:
   ```python
   # instance/config.py
   GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
   ```

## Step 5: Update Templates

The application uses Google Maps in two main locations:

1. Home page (`app/templates/home/index.html`):

   - Shows all property listings on the map
   - Allows filtering and searching
   - Displays property markers with basic info

2. Listing detail page (`app/templates/listing/detail.html`):
   - Shows the specific property location
   - Displays distance and travel time to UCR campus
   - Provides both driving and walking directions

## Step 6: Testing

1. Start your Flask application
2. Visit the home page and verify that:
   - The map loads correctly
   - Property markers appear
   - Map controls work (zoom, pan, etc.)
3. Click on a property and verify that:
   - The detail page loads
   - The map shows the correct location
   - Distance calculations work

## Troubleshooting

### Map Not Loading

- Check browser console for API key errors
- Verify that the API key is correctly set in your environment
- Ensure all required APIs are enabled

### Distance Calculations Not Working

- Check if the Directions API is enabled
- Verify that the API key has the correct restrictions
- Look for any rate limiting or quota issues in the GCP console

### Markers Not Appearing

- Check if the property coordinates are valid
- Verify that the map initialization code is running
- Look for any JavaScript errors in the console

## Best Practices

1. **API Key Security**

   - Never commit your API key to version control
   - Use environment variables for configuration
   - Set up proper API key restrictions

2. **Performance**

   - Load the Maps API asynchronously
   - Use marker clustering for many properties
   - Cache distance calculations when possible

3. **Error Handling**
   - Implement fallbacks for failed API calls
   - Show user-friendly error messages
   - Log API errors for debugging

## Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Directions API Documentation](https://developers.google.com/maps/documentation/directions)
- [Distance Matrix API Documentation](https://developers.google.com/maps/documentation/distance-matrix)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
