/**
 * UCR HousingConnect - Google Maps Integration
 * Handles map initialization, markers, and distance calculations
 */

// UCR Campus coordinates
const UCR_CAMPUS = {
    lat: 33.9737,
    lng: -117.3281,
    name: 'UCR Campus'
};

// Initialize Google Maps
let map;
let directionsService;
let directionsRenderer;
let markers = [];

// Set a flag to track initialization
window.googleMapsLoaded = false;

// Create a global utility object for map operations
window.googleMapsUtils = {
    initMap: initMap,
    addPropertyMarker: addPropertyMarker,
    clearMarkers: clearMarkers,
    fitMapToMarkers: fitMapToMarkers,
    calculateDistanceToUCR: calculateDistanceToUCR
};

function initMap() {
    console.log("Initializing Google Maps");
    
    // Find the map container - could be different IDs depending on the page
    const mapElement = document.getElementById('map') || 
                      document.getElementById('detail-map') || 
                      document.getElementById('property-map');
    
    if (!mapElement) {
        console.error("Map container not found, cannot initialize Google Maps");
        return;
    }
    
    // Ensure the map element has proper dimensions
    if (mapElement.offsetHeight < 100) {
        console.log("Map element has insufficient height, setting explicit height");
        mapElement.style.height = '400px';
    }
    
    try {
        // Initialize the map centered on UCR
        map = new google.maps.Map(mapElement, {
            center: UCR_CAMPUS,
            zoom: 13,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });
        
        // Initialize directions service and renderer
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true
        });
        
        // Add UCR campus marker
        new google.maps.Marker({
            position: UCR_CAMPUS,
            map: map,
            title: 'UCR Campus',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#003DA5',
                fillOpacity: 1,
                strokeColor: '#FFD100',
                strokeWeight: 2
            }
        });
        
        // Check if this is a detail page by looking for data attributes
        const mapLat = parseFloat(mapElement.getAttribute('data-lat'));
        const mapLng = parseFloat(mapElement.getAttribute('data-lng'));
        const mapTitle = mapElement.getAttribute('data-title');
        
        if (!isNaN(mapLat) && !isNaN(mapLng)) {
            // This is likely a detail page, so center on the property
            map.setCenter({ lat: mapLat, lng: mapLng });
            map.setZoom(14);
            
            // Add property marker
            new google.maps.Marker({
                position: { lat: mapLat, lng: mapLng },
                map: map,
                title: mapTitle || 'Property'
            });
            
            // Calculate route to UCR
            calculateRouteToUCR(mapLat, mapLng);
        }
        
        // Set flag to indicate successful initialization
        window.googleMapsLoaded = true;
        
        // Dispatch event to indicate map is ready
        const mapReadyEvent = new Event('map_ready');
        document.dispatchEvent(mapReadyEvent);
        
        console.log("Google Maps initialized successfully");
    } catch (error) {
        console.error("Error initializing Google Maps:", error);
        // Let the fallback handle it
        if (typeof handleGoogleMapsError === 'function') {
            handleGoogleMapsError();
        }
    }
}

// Calculate route from property to UCR
function calculateRouteToUCR(propertyLat, propertyLng) {
    if (!directionsService) return;
    
    const request = {
        origin: { lat: propertyLat, lng: propertyLng },
        destination: UCR_CAMPUS,
        travelMode: google.maps.TravelMode.DRIVING
    };
    
    try {
        directionsService.route(request, function(result, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                
                // Get distance and time
                const route = result.routes[0].legs[0];
                const drivingDistanceElement = document.getElementById('driving-distance');
                if (drivingDistanceElement) {
                    drivingDistanceElement.textContent = route.distance.text;
                }
                
                const drivingTimeElement = document.getElementById('driving-time');
                if (drivingTimeElement) {
                    drivingTimeElement.textContent = route.duration.text;
                }
            } else {
                console.error('Directions request failed due to ' + status);
                
                const drivingDistanceElement = document.getElementById('driving-distance');
                if (drivingDistanceElement) {
                    drivingDistanceElement.textContent = 'Unable to calculate';
                }
                
                const drivingTimeElement = document.getElementById('driving-time');
                if (drivingTimeElement) {
                    drivingTimeElement.textContent = 'Unable to calculate';
                }
            }
        });
    } catch (error) {
        console.error('Error calculating directions:', error);
    }
}

// Calculate distance and duration from UCR to a property
async function calculateDistanceToUCR(propertyLat, propertyLng) {
    if (!directionsService) {
        return {
            drivingDistance: "Maps not initialized",
            drivingDuration: "Maps not initialized"
        };
    }
    
    const request = {
        origin: { lat: propertyLat, lng: propertyLng },
        destination: UCR_CAMPUS,
        travelMode: google.maps.TravelMode.DRIVING
    };

    try {
        return new Promise((resolve, reject) => {
            directionsService.route(request, function(result, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    const route = result.routes[0].legs[0];
                    resolve({
                        drivingDistance: route.distance.text,
                        drivingDuration: route.duration.text
                    });
                } else {
                    console.error('Error calculating distance:', status);
                    reject(new Error('Unable to calculate distance'));
                }
            });
        });
    } catch (error) {
        console.error('Error calculating distance:', error);
        return null;
    }
}

// Add a property marker to the map
function addPropertyMarker(listing) {
    if (!map || !listing || !listing.latitude || !listing.longitude) return null;
    
    const position = { lat: listing.latitude, lng: listing.longitude };
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: listing.title
    });

    // Create info window content
    const content = `
        <div class="popup-content">
            <div class="font-bold text-ucr-blue-700">${listing.title}</div>
            <div class="text-ucr-gold-600 font-medium">$${listing.price.toFixed(2)}</div>
            <div class="text-sm text-gray-600">${listing.bedrooms} bed · ${listing.bathrooms} bath</div>
            <div class="distance-info mt-2 text-sm text-gray-500">
                <i class="fas fa-car mr-1"></i> <span class="driving-distance">Calculating...</span>
            </div>
            <a href="/listing/${listing.id}" class="text-ucr-blue-500 hover:underline text-sm font-medium">View Details</a>
        </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
        content: content
    });

    // Add click listener
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
        calculateDistanceToUCR(listing.latitude, listing.longitude)
            .then(distance => {
                if (distance) {
                    const distanceElement = infoWindow.getContent().querySelector('.driving-distance');
                    if (distanceElement) {
                        distanceElement.textContent = `${distance.drivingDistance} (${distance.drivingDuration})`;
                    }
                }
            })
            .catch(err => {
                const distanceElement = infoWindow.getContent().querySelector('.driving-distance');
                if (distanceElement) {
                    distanceElement.textContent = 'Unable to calculate';
                }
            });
    });

    markers.push(marker);
    return marker;
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Fit map bounds to show all markers
function fitMapToMarkers() {
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
} 