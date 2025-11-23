#!/usr/bin/env node

/**
 * Simple seed script - creates 8 sample listings for admin@test.com
 * Just run: node scripts/seed-listings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Landlord = require('../models/Landlord');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Set MONGODB_URI environment variable first');
  process.exit(1);
}

// Add database name if needed
let finalURI = MONGODB_URI;
if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('/ucrhousing') && !MONGODB_URI.includes('?')) {
  finalURI = MONGODB_URI + '/ucrhousing';
}

const listings = [
  { title: 'Spacious 2BR Apartment Near UCR Campus', description: 'Beautiful 2-bedroom, 1-bathroom apartment located just 0.3 miles from UCR campus. Walking distance to campus, grocery stores, and restaurants. Recently renovated with modern appliances.', price: 1250, bedrooms: 2, bathrooms: 1, address: '1245 University Avenue, Riverside, CA 92507', distance_from_campus: '0.3 miles', amenities: ['parking', 'wifi', 'utilities_included', 'air_conditioning', 'heating', 'laundry'], lease_terms: ['semester', 'academic_year'], parking_type: 'driveway', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-01-15') },
  { title: 'Modern 3BR House with Garage - Great for Roommates', description: 'Large 3-bedroom, 2-bathroom house perfect for a group of students. Features include garage parking, large backyard, updated kitchen with dishwasher, and in-unit laundry.', price: 2400, bedrooms: 3, bathrooms: 2, address: '2847 Canyon Crest Drive, Riverside, CA 92507', distance_from_campus: '0.8 miles', amenities: ['parking', 'wifi', 'utilities_included', 'furnished', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'microwave'], lease_terms: ['academic_year', 'yearly'], parking_type: 'garage', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-02-01') },
  { title: 'Cozy 1BR Studio Apartment - Perfect for Graduate Students', description: 'Compact and affordable 1-bedroom studio apartment ideal for graduate students. Includes all utilities, high-speed internet, and access to on-site laundry facilities.', price: 950, bedrooms: 1, bathrooms: 1, address: '892 Magnolia Avenue, Riverside, CA 92501', distance_from_campus: '0.5 miles', amenities: ['wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'bike_storage', 'pet_friendly'], lease_terms: ['semester', 'monthly'], parking_type: 'street', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-01-20') },
  { title: 'Luxury 4BR Home with Pool - Premium Student Housing', description: 'Stunning 4-bedroom, 3-bathroom home with private pool and large backyard. Features include garage parking for 2 cars, fully furnished rooms, modern kitchen with all appliances.', price: 3200, bedrooms: 4, bathrooms: 3, address: '4563 Canyon View Drive, Riverside, CA 92507', distance_from_campus: '1.2 miles', amenities: ['parking', 'wifi', 'utilities_included', 'furnished', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'microwave', 'pool', 'gym_access'], lease_terms: ['academic_year', 'yearly'], parking_type: 'garage', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: false }, available_date: new Date('2025-02-15') },
  { title: 'Affordable 2BR Duplex - Great Value Near Campus', description: 'Well-maintained 2-bedroom, 1-bathroom duplex unit offering excellent value. Includes covered parking, utilities, and high-speed internet. Located 0.6 miles from campus.', price: 1100, bedrooms: 2, bathrooms: 1, address: '1873 Blaine Street, Riverside, CA 92507', distance_from_campus: '0.6 miles', amenities: ['parking', 'wifi', 'utilities_included', 'air_conditioning', 'heating'], lease_terms: ['semester', 'academic_year'], parking_type: 'covered', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-01-25') },
  { title: 'Charming 3BR Bungalow with Yard - Family Friendly', description: 'Beautiful 3-bedroom, 2-bathroom bungalow with large front and back yards. Features include driveway parking, updated kitchen, hardwood floors, and plenty of storage.', price: 2200, bedrooms: 3, bathrooms: 2, address: '3298 Lemon Street, Riverside, CA 92501', distance_from_campus: '1.0 mile', amenities: ['parking', 'wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'pet_friendly'], lease_terms: ['academic_year', 'yearly'], parking_type: 'driveway', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-02-10') },
  { title: 'Efficient 1BR Apartment - All Utilities Included', description: 'Modern 1-bedroom apartment with all utilities and internet included in rent. Features updated appliances, central air conditioning, and on-site laundry facilities.', price: 1050, bedrooms: 1, bathrooms: 1, address: '2156 University Avenue, Riverside, CA 92507', distance_from_campus: '0.4 miles', amenities: ['wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'microwave'], lease_terms: ['semester', 'monthly'], parking_type: 'street', campus_proximity: { walking_distance: true, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-01-30') },
  { title: 'Roommate-Friendly 4BR House - Split the Cost', description: 'Large 4-bedroom, 2.5-bathroom house perfect for a group of 4 roommates. Each bedroom is spacious with good natural light. Includes garage parking, backyard, and all major appliances.', price: 2800, bedrooms: 4, bathrooms: 2.5, address: '5127 Canyon Crest Drive, Riverside, CA 92507', distance_from_campus: '0.9 miles', amenities: ['parking', 'wifi', 'utilities_included', 'laundry', 'air_conditioning', 'heating', 'dishwasher', 'microwave', 'study_room'], lease_terms: ['academic_year', 'yearly'], parking_type: 'garage', campus_proximity: { walking_distance: false, bike_friendly: true, near_bus_stop: true }, available_date: new Date('2025-02-05') }
];

(async () => {
  try {
    await mongoose.connect(finalURI, { serverSelectionTimeoutMS: 30000 });
    console.log('✅ Connected to MongoDB');

    let admin = await Landlord.findOne({ email: 'admin@test.com' });
    if (!admin) {
      admin = new Landlord({ email: 'admin@test.com', password: await bcrypt.hash('admin123', 12), name: 'Admin User', phone: '(555) 123-4567', isActive: true });
      await admin.save();
      console.log('✅ Created admin@test.com');
    }

    await Listing.deleteMany({ contact_email: 'admin@test.com' });
    console.log('✅ Cleared old listings');

    for (const data of listings) {
      await new Listing({ ...data, landlord: admin._id, contact_email: 'admin@test.com', contact_phone: admin.phone, status: 'active' }).save();
    }
    console.log(`✅ Created ${listings.length} listings!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
