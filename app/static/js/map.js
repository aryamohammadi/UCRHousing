/**
 * UCR HousingConnect - Map Integration
 * Handles map initialization, markers, and filtering
 */

document.addEventListener('DOMContentLoaded', function() {
    // Constants for UCR campus location
    const UCR_LAT = 33.9737;
    const UCR_LNG = -117.3281;
    const DEFAULT_ZOOM = 13;
    
    // Initialize the map centered on UCR
    const map = L.map('map').setView([UCR_LAT, UCR_LNG], DEFAULT_ZOOM);
    
    // Define tile layers
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    
    // Add street map as default
    streetLayer.addTo(map);
    
    // Add a marker for UCR campus with custom UCR-branded icon
    const ucrIcon = L.divIcon({
        className: 'ucr-marker',
        html: '<div class="flex items-center justify-center w-8 h-8 bg-ucr-blue-700 text-ucr-gold-500 rounded-full shadow-lg border-2 border-white"><i class="fas fa-university text-sm"></i></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    
    L.marker([UCR_LAT, UCR_LNG], {icon: ucrIcon})
        .addTo(map)
        .bindPopup('<strong>UCR Campus</strong>')
        .openPopup();
    
    // Make map available globally for view toggle
    window.map = map;
    
    // Function to change map style
    window.setMapStyle = function(style) {
        if (style === 'streets') {
            map.removeLayer(satelliteLayer);
            map.addLayer(streetLayer);
        } else if (style === 'satellite') {
            map.removeLayer(streetLayer);
            map.addLayer(satelliteLayer);
        }
    };
    
    // Reference to DOM elements
    const mapContainer = document.getElementById('map-container');
    const listingsContainer = document.getElementById('listings-container');
    const allListingsView = document.getElementById('all-listings-view');
    const listingTemplate = document.getElementById('listing-template');
    const listingsCount = document.getElementById('listings-count');
    const filterForm = document.getElementById('filter-form');
    
    // View control buttons
    const mapViewBtn = document.getElementById('map-view');
    const satelliteViewBtn = document.getElementById('satellite-view');
    const listingsViewBtn = document.getElementById('listings-view');
    
    // Marker layer group to manage property markers
    const markers = L.layerGroup().addTo(map);
    
    // State variables
    let currentView = 'map';
    
    /**
     * Switch between map, satellite, and listings views
     */
    function switchView(view) {
        currentView = view;
        
        // Update active class on view buttons
        const viewButtons = [mapViewBtn, satelliteViewBtn, listingsViewBtn];
        viewButtons.forEach(btn => btn.classList.remove('active'));
        
        // Show/hide map and listings based on selected view
        if (view === 'map') {
            mapViewBtn.classList.add('active');
            setMapStyle('streets');
            mapContainer.classList.remove('hidden');
            allListingsView.classList.remove('active');
            listingsContainer.style.display = 'grid';
            document.querySelector('.listings-panel').classList.remove('all-listings-mode');
            
            // Trigger map resize event to fix any rendering issues
            setTimeout(() => map.invalidateSize(), 100);
        } 
        else if (view === 'satellite') {
            satelliteViewBtn.classList.add('active');
            setMapStyle('satellite');
            mapContainer.classList.remove('hidden');
            allListingsView.classList.remove('active');
            listingsContainer.style.display = 'grid';
            document.querySelector('.listings-panel').classList.remove('all-listings-mode');
            
            // Trigger map resize event to fix any rendering issues
            setTimeout(() => map.invalidateSize(), 100);
        } 
        else if (view === 'listings') {
            listingsViewBtn.classList.add('active');
            mapContainer.classList.add('hidden');
            listingsContainer.style.display = 'none';
            allListingsView.classList.add('active');
            document.querySelector('.listings-panel').classList.add('all-listings-mode');
        }
    }
    
    // Set up event listeners for view switching
    mapViewBtn.addEventListener('click', () => switchView('map'));
    satelliteViewBtn.addEventListener('click', () => switchView('satellite'));
    listingsViewBtn.addEventListener('click', () => switchView('listings'));
    
    // Add event listener for the zoom to UCR button
    document.getElementById('zoom-to-ucr').addEventListener('click', function() {
        map.setView([UCR_LAT, UCR_LNG], DEFAULT_ZOOM);
    });
    
    // Create custom marker icon
    function createMarkerIcon(price) {
        // Create price-based color (more expensive = more gold-colored)
        const priceClass = price < 1000 ? 'bg-ucr-blue-500' : 
                          price < 1500 ? 'bg-ucr-blue-600' : 
                          price < 2000 ? 'bg-ucr-blue-700' : 
                          price < 3000 ? 'bg-ucr-gold-700' : 'bg-ucr-gold-500';
        
        return L.divIcon({
            className: 'custom-marker',
            html: `<div class="flex items-center justify-center w-7 h-7 ${priceClass} text-white rounded-full shadow-lg border-2 border-white transform transition-all hover:scale-110">
                    <span class="text-xs font-bold">$${Math.round(price/100)}</span>
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        });
    }
    
    // Function to load listings from the API
    async function loadListings(filters = {}) {
        // Show loading indicator
        listingsContainer.innerHTML = '<div class="loading-indicator"></div>';
        allListingsView.innerHTML = '<div class="loading-indicator"></div>';
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.min_price) queryParams.append('min_price', filters.min_price);
        if (filters.max_price) queryParams.append('max_price', filters.max_price);
        if (filters.bedrooms) queryParams.append('bedrooms', filters.bedrooms);
        if (filters.bathrooms) queryParams.append('bathrooms', filters.bathrooms);
        if (filters.property_type) queryParams.append('property_type', filters.property_type);
        if (filters.amenities) {
            filters.amenities.forEach(id => queryParams.append('amenities', id));
        }
        
        try {
            // Fetch listings from API
            const response = await fetch(`/api/listings?${queryParams.toString()}`);
            const listings = await response.json();
            
            // Clear existing markers and listings
            markers.clearLayers();
            listingsContainer.innerHTML = '';
            allListingsView.innerHTML = '';
            
            // Update the count display
            if (listingsCount) {
                const countText = listings.length === 0 ? 'No listings found' : 
                                listings.length === 1 ? '1 listing found' : 
                                `${listings.length} listings found`;
                listingsCount.innerHTML = `<i class="fas fa-list-ul text-ucr-blue-500 mr-1"></i> ${countText}`;
            }
            
            // Display message if no listings found
            if (listings.length === 0) {
                const noListingsMsg = `
                    <div class="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-md text-center border border-yellow-200 dark:border-yellow-800">
                        <div class="text-yellow-600 dark:text-yellow-400 text-4xl mb-3">
                            <i class="fas fa-search"></i>
                        </div>
                        <p class="text-yellow-700 dark:text-yellow-300 font-medium">No listings found matching your criteria.</p>
                        <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Try adjusting your filters or check back later.</p>
                    </div>
                `;
                
                listingsContainer.innerHTML = noListingsMsg;
                allListingsView.innerHTML = noListingsMsg;
                return;
            }
            
            // Track marker references to link with listings
            const markerRefs = {};
            
            // Process each listing
            listings.forEach((listing, index) => {
                // Create marker if coordinates exist
                if (listing.latitude && listing.longitude) {
                    const marker = L.marker([listing.latitude, listing.longitude], {
                        icon: createMarkerIcon(listing.price),
                        riseOnHover: true
                    }).addTo(markers);
                    
                    const popupContent = `
                        <div class="popup-content">
                            <div class="font-bold text-ucr-blue-700">${listing.title}</div>
                            <div class="text-ucr-gold-600 font-medium">$${listing.price.toFixed(2)}</div>
                            <div class="text-sm text-gray-600">${listing.bedrooms} bed · ${listing.bathrooms} bath</div>
                            <a href="/listing/${listing.id}" class="text-ucr-blue-500 hover:underline text-sm font-medium">View Details</a>
                        </div>
                    `;
                    
                    marker.bindPopup(popupContent);
                    
                    // Store the marker reference by listing id
                    markerRefs[listing.id] = marker;
                    
                    // Make marker bounce when clicked
                    marker.on('click', function() {
                        marker._icon.classList.add('marker-bounce');
                        setTimeout(() => {
                            if (marker._icon) marker._icon.classList.remove('marker-bounce');
                        }, 500);
                    });
                }
                
                // Create listing card for map view
                const listingCard = createListingCard(listing, markerRefs[listing.id]);
                listingsContainer.appendChild(listingCard);
                
                // Create listing card for all listings view
                const allListingCard = createListingCard(listing, markerRefs[listing.id]);
                allListingsView.appendChild(allListingCard);
            });
            
            // Adjust map to show all markers
            if (markers.getLayers().length > 0) {
                const group = L.featureGroup(markers.getLayers());
                map.fitBounds(group.getBounds().pad(0.1));
            }
            
        } catch (error) {
            console.error('Error loading listings:', error);
            const errorMsg = `
                <div class="bg-red-50 dark:bg-red-900/30 p-6 rounded-md text-center border border-red-200 dark:border-red-800">
                    <div class="text-red-600 dark:text-red-400 text-4xl mb-3">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <p class="text-red-700 dark:text-red-300 font-medium">Failed to load listings.</p>
                    <p class="text-sm text-red-600 dark:text-red-400 mt-1">Please try again later.</p>
                </div>
            `;
            
            listingsContainer.innerHTML = errorMsg;
            allListingsView.innerHTML = errorMsg;
        }
    }
    
    // Function to create a listing card from template
    function createListingCard(listing, marker) {
        // Clone the template
        const template = listingTemplate.content.cloneNode(true);
        
        // Fill in listing details
        template.querySelector('.listing-title').textContent = listing.title;
        template.querySelector('.listing-price').textContent = `$${listing.price.toFixed(2)}`;
        template.querySelector('.listing-address-text').textContent = listing.address;
        template.querySelector('.listing-bedrooms-text').textContent = `${listing.bedrooms} bed`;
        template.querySelector('.listing-bathrooms-text').textContent = `${listing.bathrooms} bath`;
        template.querySelector('.listing-property-type-text').textContent = listing.property_type;
        
        const description = listing.description;
        template.querySelector('.listing-description').textContent = 
            description.length > 100 ? description.substring(0, 100) + '...' : description;
        
        // Set link URL
        const link = template.querySelector('.listing-link');
        link.href = `/listing/${listing.id}`;
        
        // Add available date if present
        if (listing.available_date) {
            const availDate = new Date(listing.available_date);
            template.querySelector('.listing-available-date').textContent = `Available: ${availDate.toLocaleDateString()}`;
        }
        
        // Add interaction with corresponding map marker
        const card = template.querySelector('.listing-card');
        if (marker) {
            card.addEventListener('mouseenter', () => {
                marker.openPopup();
                marker._icon.classList.add('marker-bounce');
            });
            
            card.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    if (marker._icon) marker._icon.classList.remove('marker-bounce');
                }, 500);
            });
            
            card.addEventListener('click', () => {
                // Only switch to map view if in listings view
                if (currentView === 'listings') {
                    switchView('map');
                }
                
                map.setView(marker.getLatLng(), 16);
                marker.openPopup();
                marker._icon.classList.add('marker-bounce');
                setTimeout(() => {
                    if (marker._icon) marker._icon.classList.remove('marker-bounce');
                }, 500);
            });
        }
        
        return template;
    }
    
    // Handle filter form submission
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Gather filter values
            const filters = {
                min_price: document.getElementById('min_price').value,
                max_price: document.getElementById('max_price').value,
                bedrooms: document.getElementById('bedrooms').value,
                bathrooms: document.getElementById('bathrooms').value,
                property_type: document.getElementById('property_type').value,
                amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(el => el.value)
            };
            
            // Load filtered listings
            loadListings(filters);
        });
    }
    
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', function() {
        // Trigger map resize to fix rendering issues
        map.invalidateSize();
    });
    
    // Add custom styles for the map markers
    const mapStyleSheet = document.createElement('style');
    mapStyleSheet.textContent = `
        .custom-marker {
            transition: transform 0.2s ease-out;
        }
        .custom-marker:hover {
            transform: scale(1.2);
        }
        .marker-bounce {
            animation: bounce 0.5s ease-in-out 1;
        }
        .ucr-marker {
            z-index: 1000 !important;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(mapStyleSheet);
    
    // Load initial listings
    loadListings();
}); 