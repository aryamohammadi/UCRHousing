from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

# Many-to-many relationship table for listings and amenities
listing_amenities = db.Table('listing_amenities',
    db.Column('listing_id', db.Integer, db.ForeignKey('listing.id'), primary_key=True),
    db.Column('amenity_id', db.Integer, db.ForeignKey('amenity.id'), primary_key=True)
)

class User(db.Model):
    """User model for authentication and account management"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user', 'property_manager', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # One-to-many relationship with listings (for property managers)
    listings = db.relationship('Listing', backref='owner', lazy='dynamic')
    
    def set_password(self, password):
        """Set hashed password"""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Check if password matches"""
        return check_password_hash(self.password_hash, password)
        
    def is_admin(self):
        """Check if user has admin role"""
        return self.role == 'admin'
        
    def is_property_manager(self):
        """Check if user has property manager role"""
        return self.role == 'property_manager'
    
    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Listing(db.Model):
    """Housing listing model representing available properties"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    address = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    bedrooms = db.Column(db.Integer, nullable=False)
    bathrooms = db.Column(db.Float, nullable=False)
    
    # New fields for multi-unit properties (apartment complexes)
    min_bedrooms = db.Column(db.Integer, nullable=True)
    max_bedrooms = db.Column(db.Integer, nullable=True)
    min_bathrooms = db.Column(db.Float, nullable=True)
    max_bathrooms = db.Column(db.Float, nullable=True)
    is_multi_unit = db.Column(db.Boolean, default=False)
    unit_options = db.Column(db.Text, nullable=True)  # Stored as JSON
    
    square_feet = db.Column(db.Integer, nullable=True)
    property_type = db.Column(db.String(50), nullable=False)  # apartment, house, room, etc.
    available_date = db.Column(db.Date, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    contact_email = db.Column(db.String(100), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Owner reference (for property managers)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    amenities = db.relationship('Amenity', secondary=listing_amenities, 
                                lazy='subquery', backref=db.backref('listings', lazy=True))
    
    def __repr__(self):
        return f'<Listing {self.title} - ${self.price}>'
    
    @property
    def unit_options_list(self):
        """Returns the unit options as a list of dictionaries"""
        if not self.unit_options:
            return []
        try:
            return json.loads(self.unit_options)
        except:
            return []
    
    @unit_options_list.setter
    def unit_options_list(self, options):
        """Sets the unit options from a list of dictionaries"""
        if options:
            self.unit_options = json.dumps(options)
        else:
            self.unit_options = None
    
    def to_dict(self):
        """Convert listing to dictionary for API responses"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'address': self.address,
            'price': self.price,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'square_feet': self.square_feet,
            'property_type': self.property_type,
            'available_date': self.available_date.isoformat() if self.available_date else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'amenities': [amenity.name for amenity in self.amenities],
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_multi_unit': self.is_multi_unit,
            'unit_options': self.unit_options_list,
            'owner_id': self.user_id
        }
        
        # Add multi-unit data if applicable
        if self.is_multi_unit:
            data.update({
                'min_bedrooms': self.min_bedrooms,
                'max_bedrooms': self.max_bedrooms,
                'min_bathrooms': self.min_bathrooms,
                'max_bathrooms': self.max_bathrooms
            })
        
        return data

class Amenity(db.Model):
    """Amenity model for housing features like parking, laundry, etc."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    icon = db.Column(db.String(50), nullable=True)  # For potential UI icons
    
    def __repr__(self):
        return f'<Amenity {self.name}>'
