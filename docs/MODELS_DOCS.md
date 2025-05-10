# Models Documentation

This document describes the database models used in the UCR HousingConnect application, defined in `models.py`.

## Overview

The application uses SQLAlchemy as an ORM (Object-Relational Mapper) with two main models:

1. `Listing`: Represents housing listings (apartments, houses, etc.)
2. `Amenity`: Represents features that properties may have (parking, laundry, etc.)

These models are connected through a many-to-many relationship, allowing each listing to have multiple amenities.

## Listing Model

```python
class Listing(db.Model):
    """Housing listing model representing available properties"""
```

### Fields

| Field            | Type        | Description                        |
| ---------------- | ----------- | ---------------------------------- |
| `id`             | Integer     | Primary key                        |
| `title`          | String(100) | Listing title                      |
| `description`    | Text        | Detailed description               |
| `address`        | String(200) | Property address                   |
| `price`          | Float       | Monthly rent price                 |
| `bedrooms`       | Integer     | Number of bedrooms                 |
| `bathrooms`      | Float       | Number of bathrooms                |
| `min_bedrooms`   | Integer     | Minimum bedrooms (for multi-unit)  |
| `max_bedrooms`   | Integer     | Maximum bedrooms (for multi-unit)  |
| `min_bathrooms`  | Float       | Minimum bathrooms (for multi-unit) |
| `max_bathrooms`  | Float       | Maximum bathrooms (for multi-unit) |
| `is_multi_unit`  | Boolean     | Whether it's an apartment complex  |
| `unit_options`   | Text        | JSON string of available units     |
| `square_feet`    | Integer     | Square footage                     |
| `property_type`  | String(50)  | Type (apartment, house, room)      |
| `available_date` | Date        | When the property is available     |
| `latitude`       | Float       | Geographical latitude              |
| `longitude`      | Float       | Geographical longitude             |
| `contact_email`  | String(100) | Contact email address              |
| `contact_phone`  | String(20)  | Contact phone number               |
| `created_at`     | DateTime    | Record creation timestamp          |
| `updated_at`     | DateTime    | Record update timestamp            |

### Relationships

- `amenities`: Many-to-many relationship with the Amenity model

### Methods

| Method              | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `unit_options_list` | Property that returns unit options as a list of dictionaries |
| `to_dict()`         | Converts listing to a dictionary for JSON responses          |

## Amenity Model

```python
class Amenity(db.Model):
    """Amenity model for housing features like parking, laundry, etc."""
```

### Fields

| Field  | Type       | Description              |
| ------ | ---------- | ------------------------ |
| `id`   | Integer    | Primary key              |
| `name` | String(50) | Amenity name (unique)    |
| `icon` | String(50) | Icon name for UI display |

### Relationships

- `listings`: Back-reference to listings with this amenity

## Many-to-Many Relationship

The relationship between listings and amenities is defined using an association table:

```python
listing_amenities = db.Table('listing_amenities',
    db.Column('listing_id', db.Integer, db.ForeignKey('listing.id'), primary_key=True),
    db.Column('amenity_id', db.Integer, db.ForeignKey('amenity.id'), primary_key=True)
)
```

This allows:

- Each listing to have multiple amenities
- Each amenity to be associated with multiple listings

## Multi-Unit Properties

The model supports both single properties and multi-unit properties (like apartment complexes):

- Single properties: Use the `bedrooms`, `bathrooms` fields
- Multi-unit properties:
  - Set `is_multi_unit` to `True`
  - Use `min_bedrooms`, `max_bedrooms`, `min_bathrooms`, `max_bathrooms` for ranges
  - Store individual unit options in `unit_options_list` as JSON

## Usage Examples

### Creating a new listing

```python
new_listing = Listing(
    title="2-Bedroom Apartment near UCR",
    description="Spacious apartment with great amenities",
    address="123 University Ave, Riverside, CA 92507",
    price=1500.00,
    bedrooms=2,
    bathrooms=1.5,
    property_type="apartment",
    contact_email="owner@example.com"
)
```

### Adding amenities to a listing

```python
# Get amenities from database
parking = Amenity.query.filter_by(name="Parking").first()
laundry = Amenity.query.filter_by(name="In-unit Laundry").first()

# Add to listing
new_listing.amenities = [parking, laundry]
```

### Storing multi-unit options

```python
listing.is_multi_unit = True
listing.min_bedrooms = 1
listing.max_bedrooms = 3
listing.min_bathrooms = 1
listing.max_bathrooms = 2

# Set unit options
listing.unit_options_list = [
    {
        "name": "Studio",
        "bedrooms": 0,
        "bathrooms": 1,
        "price": 1200,
        "square_feet": 450
    },
    {
        "name": "1BR Deluxe",
        "bedrooms": 1,
        "bathrooms": 1,
        "price": 1500,
        "square_feet": 650
    }
]
```
