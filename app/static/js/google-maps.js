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

function initMap() {
    // Initialize the map centered on UCR
    map = new google.maps.Map(document.getElementById('map'), {
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

    // Add map controls
    const mapControls = document.createElement('div');
    mapControls.className = 'map-controls';
    mapControls.innerHTML = `
        <div class="view-tabs">
            <button id="map-view" class="view-tab active">
                <i class="fas fa-map mr-1"></i> Map
            </button>
            <button id="satellite-view" class="view-tab">
                <i class="fas fa-satellite-dish mr-1"></i> Satellite
            </button>
        </div>
    `;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(mapControls);

    // Add zoom to UCR button
    const zoomToUCRButton = document.createElement('button');
    zoomToUCRButton.className = 'zoom-to-ucr';
    zoomToUCRButton.innerHTML = '<i class="fas fa-university mr-1"></i> UCR Campus';
    zoomToUCRButton.onclick = () => {
        map.setCenter(UCR_CAMPUS);
        map.setZoom(13);
    };
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(zoomToUCRButton);

    // Set up view toggle handlers
    document.getElementById('map-view').onclick = () => {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        document.getElementById('map-view').classList.add('active');
        document.getElementById('satellite-view').classList.remove('active');
    };

    document.getElementById('satellite-view').onclick = () => {
        map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
        document.getElementById('satellite-view').classList.add('active');
        document.getElementById('map-view').classList.remove('active');
    };
}

// Calculate distance and duration from UCR to a property
async function calculateDistanceToUCR(propertyLat, propertyLng) {
    const request = {
        origin: { lat: propertyLat, lng: propertyLng },
        destination: UCR_CAMPUS,
        travelMode: google.maps.TravelMode.DRIVING
    };

    try {
        const result = await directionsService.route(request);
        const route = result.routes[0].legs[0];
        return {
            drivingDistance: route.distance.text,
            drivingDuration: route.duration.text
        };
    } catch (error) {
        console.error('Error calculating distance:', error);
        return null;
    }
}

// Add a property marker to the map
function addPropertyMarker(listing) {
    const position = { lat: listing.latitude, lng: listing.longitude };
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: listing.title,
        animation: google.maps.Animation.DROP
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
    if (markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
}

// Export functions for use in other modules
window.googleMapsUtils = {
    initMap,
    addPropertyMarker,
    clearMarkers,
    fitMapToMarkers,
    calculateDistanceToUCR
}; 