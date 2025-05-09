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
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker for UCR campus
    L.marker([UCR_LAT, UCR_LNG])
        .addTo(map)
        .bindPopup('<strong>UCR Campus</strong>')
        .openPopup();
    
    // Reference to the listings container and template
    const listingsContainer = document.getElementById('listings-container');
    const listingTemplate = document.getElementById('listing-template');
    
    // Reference to the filter form
    const filterForm = document.getElementById('filter-form');
    
    // Marker layer group to manage property markers
    const markers = L.layerGroup().addTo(map);
    
    // Function to load listings from the API
    async function loadListings(filters = {}) {
        // Show loading indicator
        listingsContainer.innerHTML = '<div class="loading-indicator"></div>';
        
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
            
            // Display message if no listings found
            if (listings.length === 0) {
                listingsContainer.innerHTML = `
                    <div class="bg-yellow-50 p-4 rounded-md text-center">
                        <p class="text-yellow-700">No listings found matching your criteria.</p>
                        <p class="text-sm text-yellow-600 mt-1">Try adjusting your filters.</p>
                    </div>
                `;
                return;
            }
            
            // Process each listing
            listings.forEach(listing => {
                // Create marker if coordinates exist
                if (listing.latitude && listing.longitude) {
                    const marker = L.marker([listing.latitude, listing.longitude])
                        .addTo(markers)
                        .bindPopup(`
                            <strong>${listing.title}</strong><br>
                            $${listing.price.toFixed(2)}<br>
                            <a href="/listing/${listing.id}" target="_blank">View Details</a>
                        `);
                }
                
                // Create listing card
                const listingCard = createListingCard(listing);
                listingsContainer.appendChild(listingCard);
            });
            
            // Adjust map to show all markers
            if (markers.getLayers().length > 0) {
                const group = L.featureGroup(markers.getLayers());
                map.fitBounds(group.getBounds().pad(0.1));
            }
            
        } catch (error) {
            console.error('Error loading listings:', error);
            listingsContainer.innerHTML = `
                <div class="bg-red-50 p-4 rounded-md text-center">
                    <p class="text-red-700">Failed to load listings.</p>
                    <p class="text-sm text-red-600 mt-1">Please try again later.</p>
                </div>
            `;
        }
    }
    
    // Function to create a listing card from template
    function createListingCard(listing) {
        // Clone the template
        const template = listingTemplate.content.cloneNode(true);
        
        // Fill in listing details
        template.querySelector('.listing-title').textContent = listing.title;
        template.querySelector('.listing-price').textContent = `$${listing.price.toFixed(2)}`;
        template.querySelector('.listing-address').textContent = listing.address;
        template.querySelector('.listing-bedrooms').textContent = `${listing.bedrooms} bed`;
        template.querySelector('.listing-bathrooms').textContent = `${listing.bathrooms} bath`;
        template.querySelector('.listing-property-type').textContent = listing.property_type;
        
        const description = listing.description;
        template.querySelector('.listing-description').textContent = 
            description.length > 100 ? description.substring(0, 100) + '...' : description;
        
        // Set link URL
        const link = template.querySelector('.listing-link');
        link.href = `/listing/${listing.id}`;
        
        return template;
    }
    
    // Handle filter form submission
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect filter values
            const formData = new FormData(filterForm);
            const filters = {
                min_price: formData.get('min_price'),
                max_price: formData.get('max_price'),
                bedrooms: formData.get('bedrooms'),
                bathrooms: formData.get('bathrooms'),
                property_type: formData.get('property_type'),
                amenities: formData.getAll('amenities')
            };
            
            // Update URL with filters for shareable links
            const url = new URL(window.location);
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    // Remove existing params
                    url.searchParams.delete(key);
                    // Add each value
                    value.forEach(v => {
                        if (v) url.searchParams.append(key, v);
                    });
                } else if (value) {
                    url.searchParams.set(key, value);
                } else {
                    url.searchParams.delete(key);
                }
            });
            
            window.history.pushState({}, '', url);
            
            // Load listings with filters
            loadListings(filters);
        });
    }
    
    // Initial load of listings
    loadListings();
}); 