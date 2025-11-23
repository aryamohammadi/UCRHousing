#!/usr/bin/env node

/**
 * Simple script to add sample listings via API
 * Just run: node scripts/add-sample-listings.js
 */

const API_URL = process.env.API_URL || 'https://backend-api-production-cc33.up.railway.app/api';

const listings = [
  { title: 'Spacious 2BR Apartment Near UCR Campus', description: 'Beautiful 2-bedroom, 1-bathroom apartment located just 0.3 miles from UCR campus. Walking distance to campus, grocery stores, and restaurants. Recently renovated with modern appliances. Perfect for students looking for a quiet, comfortable living space.', price: 1250, bedrooms: 2, bathrooms: 1, address: '1245 University Avenue, Riverside, CA 92507', distance_from_campus: '0.3 miles', amenities: ['parking', 'wifi', 'utilities_included', 'air_conditioning', 'heating', 'laundry'], lease_terms: ['semester', 'academic_year'], parking_type: 'driveway', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true } },
  { title: 'Modern 3BR House with Garage - Great for Roommates', description: 'Large 3-bedroom, 2-bathroom house perfect for a group of students. Features include garage parking, large backyard, updated kitchen with dishwasher, and in-unit laundry. Located in a quiet neighborhood just 0.8 miles from campus.', price: 2400, bedrooms: 3, bathrooms: 2, address: '2847 Canyon Crest Drive, Riverside, CA 92507', distance_from_campus: '0.8 miles', amenities: ['parking', 'wifi', 'utilities_included', 'furnished', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'microwave'], lease_terms: ['academic_year', 'yearly'], parking_type: 'garage', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: true } },
  { title: 'Cozy 1BR Studio Apartment - Perfect for Graduate Students', description: 'Compact and affordable 1-bedroom studio apartment ideal for graduate students or single professionals. Includes all utilities, high-speed internet, and access to on-site laundry facilities. Located 0.5 miles from campus.', price: 950, bedrooms: 1, bathrooms: 1, address: '892 Magnolia Avenue, Riverside, CA 92501', distance_from_campus: '0.5 miles', amenities: ['wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'bike_storage', 'pet_friendly'], lease_terms: ['semester', 'monthly'], parking_type: 'street', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true } },
  { title: 'Luxury 4BR Home with Pool - Premium Student Housing', description: 'Stunning 4-bedroom, 3-bathroom home with private pool and large backyard. Perfect for students who want premium living. Features include garage parking for 2 cars, fully furnished rooms, modern kitchen with all appliances.', price: 3200, bedrooms: 4, bathrooms: 3, address: '4563 Canyon View Drive, Riverside, CA 92507', distance_from_campus: '1.2 miles', amenities: ['parking', 'wifi', 'utilities_included', 'furnished', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'microwave', 'pool', 'gym_access'], lease_terms: ['academic_year', 'yearly'], parking_type: 'garage', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: false } },
  { title: 'Affordable 2BR Duplex - Great Value Near Campus', description: 'Well-maintained 2-bedroom, 1-bathroom duplex unit offering excellent value. Includes covered parking, utilities, and high-speed internet. Located 0.6 miles from campus with easy walking or biking access.', price: 1100, bedrooms: 2, bathrooms: 1, address: '1873 Blaine Street, Riverside, CA 92507', distance_from_campus: '0.6 miles', amenities: ['parking', 'wifi', 'utilities_included', 'air_conditioning', 'heating'], lease_terms: ['semester', 'academic_year'], parking_type: 'covered', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true } },
  { title: 'Charming 3BR Bungalow with Yard - Family Friendly', description: 'Beautiful 3-bedroom, 2-bathroom bungalow with large front and back yards. Ideal for students with families or those who want extra space. Features include driveway parking, updated kitchen, hardwood floors.', price: 2200, bedrooms: 3, bathrooms: 2, address: '3298 Lemon Street, Riverside, CA 92501', distance_from_campus: '1.0 mile', amenities: ['parking', 'wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'pet_friendly'], lease_terms: ['academic_year', 'yearly'], parking_type: 'driveway', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: true } },
  { title: 'Efficient 1BR Apartment - All Utilities Included', description: 'Modern 1-bedroom apartment with all utilities and internet included in rent. Features updated appliances, central air conditioning, and on-site laundry facilities. Located 0.4 miles from campus.', price: 1050, bedrooms: 1, bathrooms: 1, address: '2156 University Avenue, Riverside, CA 92507', distance_from_campus: '0.4 miles', amenities: ['wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'microwave'], lease_terms: ['semester', 'monthly'], parking_type: 'street', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true } },
  { title: 'Roommate-Friendly 4BR House - Split the Cost', description: 'Large 4-bedroom, 2.5-bathroom house perfect for a group of 4 roommates. Each bedroom is spacious with good natural light. Includes garage parking, backyard, and all major appliances.', price: 2800, bedrooms: 4, bathrooms: 2.5, address: '5127 Canyon Crest Drive, Riverside, CA 92507', distance_from_campus: '0.9 miles', amenities: ['parking', 'wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'microwave', 'study_room'], lease_terms: ['academic_year', 'yearly'], parking_type: 'garage', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: true } }
];

async function addListings() {
  // First, register/login as admin@test.com
  console.log('📝 Step 1: Creating admin@test.com account...');
  let token;
  
  try {
    // Try to register
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Admin User',
        phone: '(555) 123-4567'
      })
    });
    
    if (registerRes.ok) {
      const data = await registerRes.json();
      token = data.token;
      console.log('✅ Account created');
    } else {
      // Try to login instead
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'admin123'
        })
      });
      
      if (loginRes.ok) {
        const data = await loginRes.json();
        token = data.token;
        console.log('✅ Logged in');
      } else {
        throw new Error('Failed to create/login');
      }
    }
  } catch (error) {
    console.error('❌ Auth failed:', error.message);
    process.exit(1);
  }

  // Delete existing listings from this account
  console.log('📝 Step 2: Getting existing listings...');
  try {
    const myListingsRes = await fetch(`${API_URL}/listings/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (myListingsRes.ok) {
      const data = await myListingsRes.json();
      if (data.listings && data.listings.length > 0) {
        console.log(`🗑️  Found ${data.listings.length} existing listings, deleting...`);
        for (const listing of data.listings) {
          await fetch(`${API_URL}/listings/${listing._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        console.log('✅ Deleted old listings');
      }
    }
  } catch (error) {
    console.log('⚠️  Could not delete old listings (continuing anyway)');
  }

  // Create new listings
  console.log(`📝 Step 3: Creating ${listings.length} new listings...`);
  let success = 0;
  
  for (const listing of listings) {
    try {
      const res = await fetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(listing)
      });
      
      if (res.ok) {
        success++;
        console.log(`  ✅ ${listing.title}`);
      } else {
        const error = await res.json();
        console.log(`  ❌ ${listing.title}: ${error.error || 'Failed'}`);
      }
    } catch (error) {
      console.log(`  ❌ ${listing.title}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Created ${success}/${listings.length} listings!`);
  console.log(`🔗 View at: https://www.dormduos.com/listings`);
}

addListings().catch(console.error);

