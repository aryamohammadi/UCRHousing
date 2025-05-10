# Static Directory Documentation

The `static` directory contains all client-side assets used by the application, including CSS stylesheets, JavaScript files, images, icons, and other resources.

## Directory Structure

```
static/
├── css/                # CSS stylesheets
│   └── main.css        # Main application styles (Tailwind CSS)
├── js/                 # JavaScript files
│   ├── google-maps.js  # Google Maps integration
│   ├── map.js          # Legacy map functionality (OpenStreetMap)
│   └── chat.js         # Chat interface functionality
└── favicon.svg         # Site favicon
```

## JavaScript Files

### google-maps.js

Handles all Google Maps functionality:

- Map initialization
- Property marker management
- Distance calculations to UCR
- Info window customization
- Map controls (zoom, view toggle)

Key functions:

- `initMap()`: Initializes the Google Maps instance
- `calculateDistanceToUCR()`: Computes driving and walking distances
- `addPropertyMarker()`: Adds a property marker to the map
- `clearMarkers()`: Removes all markers from the map
- `fitMapToMarkers()`: Adjusts the map view to show all markers

### map.js

Legacy map functionality using OpenStreetMap/Leaflet.js (kept for reference):

- Map initialization
- Marker management
- View controls
- Listing interactions

### chat.js

Powers the chat interface for the rule-based matching system:

- Message submission
- API communication
- Response rendering
- Loading indicators
- Listing suggestions display

Key functions:

- `sendMessage()`: Sends user query to the backend
- `addMessageToChat()`: Adds messages to the chat UI
- `displayListings()`: Shows suggested listings
- `formatMarkdown()`: Processes markdown in responses

## CSS

### main.css

Main application styles:

- Based on Tailwind CSS framework
- Custom component styling
- Responsive design rules
- Light and dark mode theming
- Animations and transitions

## Conventions

### JavaScript

- All JavaScript is organized into modular files by feature
- ES6+ syntax is used throughout
- Event listeners are added after DOM is fully loaded
- Error handling for all asynchronous operations
- Console logging for development debugging

### CSS

- Tailwind CSS is the primary styling approach
- Custom components use BEM naming convention
- Variables for colors, spacing, and typography
- Responsive design using mobile-first approach
- Vendor prefixing for cross-browser compatibility

## Usage Notes

- All JavaScript is loaded at the end of the HTML body
- CSS is loaded in the document head
- External libraries are kept to a minimum
- SVG is preferred for icons and simple graphics
- Assets are optimized for performance
