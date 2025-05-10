"""
UCR HousingConnect - Rule-Based Matching System
Replaces OpenAI chat with a keyword-based matching algorithm
"""

import re
import os
import logging
from collections import Counter
import nltk
from nltk.stem import PorterStemmer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to load NLTK resources, but provide fallbacks if unavailable
try:
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    nltk_available = True
    logger.info("NLTK resources loaded successfully")
except (LookupError, ImportError) as e:
    nltk_available = False
    logger.warning(f"NLTK resources not available: {str(e)}")

# Basic stop words set for fallback
BASIC_STOP_WORDS = {'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
                  'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 
                  'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 
                  'itself', 'they', 'them', 'their', 'theirs', 'themselves', 
                  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 
                  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
                  'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
                  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 
                  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 
                  'into', 'through', 'during', 'before', 'after', 'above', 'below', 
                  'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 
                  'under', 'again', 'further', 'then', 'once', 'here', 'there', 
                  'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 
                  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
                  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 
                  's', 't', 'can', 'will', 'just', 'don', 'should', 'now'}

class ListingMatcher:
    """Rule-based system for matching user queries to housing listings"""
    
    def __init__(self):
        """Initialize the matcher with NLP tools"""
        self.stemmer = PorterStemmer()
        
        # Try to get stopwords from NLTK, fall back to basic set if not available
        try:
            if nltk_available:
                self.stop_words = set(stopwords.words('english'))
                logger.info("Using NLTK stopwords")
            else:
                self.stop_words = BASIC_STOP_WORDS
                logger.info("Using basic stopwords (NLTK not available)")
        except Exception as e:
            logger.warning(f"Error loading stopwords: {str(e)}")
            self.stop_words = BASIC_STOP_WORDS
            
    def preprocess_text(self, text):
        """Preprocess text by lowercasing, tokenizing, removing stop words, and stemming"""
        text = text.lower()
        
        # Use NLTK tokenizer if available, otherwise fall back to simple split
        try:
            if nltk_available:
                tokens = word_tokenize(text)
            else:
                # Simple tokenization as fallback
                tokens = text.split()
        except Exception as e:
            logger.warning(f"Error in tokenization: {str(e)}")
            tokens = text.split()
            
        # Filter tokens and apply stemming
        tokens = [token for token in tokens if token not in self.stop_words and token.isalpha()]
        stems = [self.stemmer.stem(token) for token in tokens]
        return stems
    
    def extract_preferences(self, query):
        """Extract user preferences from their query"""
        preferences = {
            'bedrooms': None,
            'min_bedrooms': None,
            'max_bedrooms': None,
            'bathrooms': None,
            'min_bathrooms': None,
            'max_bathrooms': None, 
            'min_price': None,
            'max_price': None,
            'property_type': None,
            'amenities': [],
            'near_ucr': False,
            'keywords': []
        }
        
        # Clean the query and convert to lowercase
        query = query.lower()
        
        # Extract bedroom information
        bedroom_patterns = [
            (r"(\d+)\s*(?:bedroom|bed room|bed|br)\b", "exact"),
            (r"(\d+)\s*-\s*(\d+)\s*(?:bedroom|bed room|bed|br)", "range"),
            (r"studio\s+apartment|studio\s+apt|studio", "studio")
        ]
        
        for pattern, match_type in bedroom_patterns:
            matches = re.findall(pattern, query)
            if matches:
                if match_type == "exact":
                    preferences['bedrooms'] = int(matches[0])
                    break
                elif match_type == "range":
                    # For range, save as min and max
                    preferences['min_bedrooms'] = int(matches[0][0])
                    preferences['max_bedrooms'] = int(matches[0][1])
                    break
                elif match_type == "studio":
                    preferences['bedrooms'] = 0  # Studio is treated as 0 bedrooms
                    break
        
        # Extract bathroom information
        bathroom_patterns = [
            (r"(\d+(?:\.\d+)?)\s*(?:bathroom|bath room|bath|ba)\b", "exact"),
            (r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:bathroom|bath room|bath|ba)", "range")
        ]
        
        for pattern, match_type in bathroom_patterns:
            matches = re.findall(pattern, query)
            if matches:
                if match_type == "exact":
                    preferences['bathrooms'] = float(matches[0])
                    break
                elif match_type == "range":
                    # For range, save as min and max
                    preferences['min_bathrooms'] = float(matches[0][0])
                    preferences['max_bathrooms'] = float(matches[0][1])
                    break
        
        # Extract price information
        price_patterns = [
            (r"(?:under|less than|below|max|maximum)\s*\$?(\d+(?:,\d+)?)", "max"),
            (r"(?:over|more than|above|min|minimum)\s*\$?(\d+(?:,\d+)?)", "min"),
            (r"\$?(\d+(?:,\d+)?)\s*(?:to|-)\s*\$?(\d+(?:,\d+)?)", "range"),
            (r"\$(\d+(?:,\d+)?)", "exact")
        ]
        
        for pattern, match_type in price_patterns:
            matches = re.findall(pattern, query)
            if matches:
                if match_type == "max":
                    # Convert numbers like 1,500 to 1500
                    price_str = matches[0].replace(',', '')
                    preferences['max_price'] = int(price_str)
                    break
                elif match_type == "min":
                    price_str = matches[0].replace(',', '')
                    preferences['min_price'] = int(price_str)
                    break
                elif match_type == "range":
                    min_price_str = matches[0][0].replace(',', '')
                    max_price_str = matches[0][1].replace(',', '')
                    preferences['min_price'] = int(min_price_str)
                    preferences['max_price'] = int(max_price_str)
                    break
                elif match_type == "exact":
                    price_str = matches[0].replace(',', '')
                    # If only an exact price is mentioned, interpret as a preferred price point
                    exact_price = int(price_str)
                    preferences['min_price'] = exact_price * 0.9  # 10% below
                    preferences['max_price'] = exact_price * 1.1  # 10% above
                    break
        
        # Extract property type
        property_types = {
            'apartment': ['apartment', 'apt', 'flat', 'condo', 'condominium'],
            'house': ['house', 'home', 'townhouse', 'town house', 'bungalow', 'cottage'],
            'room': ['room', 'bedroom', 'shared', 'dorm']
        }
        
        for prop_type, keywords in property_types.items():
            for keyword in keywords:
                if re.search(r"\b" + keyword + r"\b", query):
                    preferences['property_type'] = prop_type
                    break
            if preferences['property_type']:
                break
        
        # Extract amenities
        amenity_keywords = {
            'parking': ['parking', 'garage', 'covered parking', 'parking spot', 'car', 'vehicle'],
            'pet-friendly': ['pet', 'dog', 'cat', 'animal', 'pet-friendly', 'pet friendly'],
            'laundry': ['laundry', 'washer', 'dryer', 'w/d', 'washer/dryer', 'washer and dryer', 'washing machine'],
            'furnished': ['furnished', 'furniture', 'equipped'],
            'air-conditioning': ['ac', 'a/c', 'air conditioning', 'air-conditioning', 'cooling'],
            'heating': ['heating', 'heater', 'heated', 'central heat'],
            'pool': ['pool', 'swimming pool', 'swim'],
            'gym': ['gym', 'fitness', 'workout', 'exercise'],
            'balcony': ['balcony', 'patio', 'terrace', 'outdoor space', 'deck'],
            'security': ['security', 'gated', 'doorman', 'secure', 'surveillance', 'cameras'],
            'utilities-included': ['utilities included', 'utilities', 'bills included', 'water included', 'electricity included'],
            'internet': ['internet', 'wifi', 'broadband', 'high-speed internet']
        }
        
        for amenity, keywords in amenity_keywords.items():
            for keyword in keywords:
                if re.search(r"\b" + keyword + r"\b", query):
                    preferences['amenities'].append(amenity)
                    break
        
        # Check if near UCR is mentioned
        ucr_keywords = ['ucr', 'campus', 'university', 'riverside', 'college', 'school', 'near ucr', 'close to ucr', 'walking distance']
        for keyword in ucr_keywords:
            if keyword in query:
                preferences['near_ucr'] = True
                break
        
        # Extract general keywords for additional matching
        tokens = self.preprocess_text(query)
        preferences['keywords'] = tokens
        
        return preferences
    
    def calculate_listing_score(self, listing, preferences):
        """Score a listing based on how well it matches the user's preferences"""
        score = 0
        explanation = []
        
        # Score bedroom match
        if preferences['bedrooms'] is not None:
            if listing.get('is_multi_unit'):
                # For multi-unit properties, check if the desired bedrooms falls within range
                if (listing.get('min_bedrooms') <= preferences['bedrooms'] <= listing.get('max_bedrooms')):
                    score += 10
                    explanation.append(f"Has the desired {preferences['bedrooms']} bedrooms")
                else:
                    bedrooms_diff = min(
                        abs(listing.get('min_bedrooms', 0) - preferences['bedrooms']),
                        abs(listing.get('max_bedrooms', 0) - preferences['bedrooms'])
                    )
                    # Penalize by difference in bedrooms
                    if bedrooms_diff <= 1:
                        score += 5
                        explanation.append(f"Close to desired bedroom count (within 1)")
                    else:
                        score -= bedrooms_diff * 2
            else:
                # For single units
                if listing.get('bedrooms') == preferences['bedrooms']:
                    score += 10
                    explanation.append(f"Exactly {preferences['bedrooms']} bedrooms as requested")
                else:
                    bedrooms_diff = abs(listing.get('bedrooms', 0) - preferences['bedrooms'])
                    if bedrooms_diff <= 1:
                        score += 5
                        explanation.append(f"Close to desired bedroom count (within 1)")
                    else:
                        score -= bedrooms_diff * 2
        elif preferences['min_bedrooms'] is not None and preferences['max_bedrooms'] is not None:
            # Handle bedroom range requests
            if listing.get('is_multi_unit'):
                # Check if ranges overlap
                if (listing.get('min_bedrooms') <= preferences['max_bedrooms'] and
                    listing.get('max_bedrooms') >= preferences['min_bedrooms']):
                    score += 8
                    explanation.append("Bedroom options within desired range")
                else:
                    score -= 5
            else:
                # For single units, check if within range
                if (preferences['min_bedrooms'] <= listing.get('bedrooms', 0) <= preferences['max_bedrooms']):
                    score += 8
                    explanation.append("Bedrooms within desired range")
                else:
                    score -= 5
        
        # Score bathroom match (similar logic to bedrooms)
        if preferences['bathrooms'] is not None:
            if listing.get('is_multi_unit'):
                if (listing.get('min_bathrooms') <= preferences['bathrooms'] <= listing.get('max_bathrooms')):
                    score += 8
                    explanation.append(f"Has the desired {preferences['bathrooms']} bathrooms")
                else:
                    bathrooms_diff = min(
                        abs(listing.get('min_bathrooms', 0) - preferences['bathrooms']),
                        abs(listing.get('max_bathrooms', 0) - preferences['bathrooms'])
                    )
                    if bathrooms_diff <= 0.5:
                        score += 4
                        explanation.append("Close to desired bathroom count")
                    else:
                        score -= bathrooms_diff * 2
            else:
                if listing.get('bathrooms') == preferences['bathrooms']:
                    score += 8
                    explanation.append(f"Exactly {preferences['bathrooms']} bathrooms as requested")
                else:
                    bathrooms_diff = abs(listing.get('bathrooms', 0) - preferences['bathrooms'])
                    if bathrooms_diff <= 0.5:
                        score += 4
                        explanation.append("Close to desired bathroom count")
                    else:
                        score -= bathrooms_diff * 2
        elif preferences['min_bathrooms'] is not None and preferences['max_bathrooms'] is not None:
            if listing.get('is_multi_unit'):
                if (listing.get('min_bathrooms') <= preferences['max_bathrooms'] and
                    listing.get('max_bathrooms') >= preferences['min_bathrooms']):
                    score += 6
                    explanation.append("Bathroom options within desired range")
                else:
                    score -= 4
            else:
                if (preferences['min_bathrooms'] <= listing.get('bathrooms', 0) <= preferences['max_bathrooms']):
                    score += 6
                    explanation.append("Bathrooms within desired range")
                else:
                    score -= 4
        
        # Score price match
        listing_price = listing.get('price', 0)
        if preferences['min_price'] is not None and preferences['max_price'] is not None:
            # Check if price is within requested range
            if preferences['min_price'] <= listing_price <= preferences['max_price']:
                score += 15
                explanation.append("Price within your budget range")
            elif listing_price < preferences['min_price']:
                # Under budget is good but we don't want to overly prioritize cheap low-quality listings
                score += 5
                explanation.append("Price below your minimum budget (good value)")
            elif listing_price <= preferences['max_price'] * 1.1:
                # Allow slightly over budget
                score += 3
                explanation.append("Price slightly over your maximum budget")
            else:
                # Significantly over budget is bad
                over_budget_percentage = (listing_price - preferences['max_price']) / preferences['max_price']
                score -= int(over_budget_percentage * 20)
        elif preferences['max_price'] is not None:
            # Only max price specified
            if listing_price <= preferences['max_price']:
                score += 15
                budget_ratio = listing_price / preferences['max_price']
                if budget_ratio <= 0.8:
                    explanation.append("Significantly under your maximum budget")
                else:
                    explanation.append("Within your maximum budget")
            elif listing_price <= preferences['max_price'] * 1.1:
                score += 2
                explanation.append("Slightly over your maximum budget")
            else:
                over_budget_percentage = (listing_price - preferences['max_price']) / preferences['max_price']
                score -= int(over_budget_percentage * 25)
        elif preferences['min_price'] is not None:
            # Only min price specified (unusual but possible)
            if listing_price >= preferences['min_price']:
                score += 5
                explanation.append("Meets your minimum price requirement")
        
        # Score property type match
        if preferences['property_type'] is not None:
            if listing.get('property_type', '').lower() == preferences['property_type']:
                score += 8
                explanation.append(f"Matches your preferred {preferences['property_type']} property type")
        
        # Score amenities match
        if preferences['amenities']:
            matched_amenities = []
            for desired_amenity in preferences['amenities']:
                # Convert to lowercase for case-insensitive matching
                listing_amenities = [a.lower() for a in listing.get('amenities', [])]
                
                # Check for direct match
                amenity_found = False
                for listing_amenity in listing_amenities:
                    if desired_amenity in listing_amenity or any(k in listing_amenity for k in desired_amenity.split('-')):
                        amenity_found = True
                        matched_amenities.append(desired_amenity)
                        break
                
                if amenity_found:
                    score += 5
            
            # Add explanation for matched amenities
            if matched_amenities:
                if len(matched_amenities) == 1:
                    explanation.append(f"Has your desired {matched_amenities[0]} amenity")
                else:
                    formatted_amenities = ", ".join(matched_amenities[:-1]) + " and " + matched_amenities[-1]
                    explanation.append(f"Includes your desired {formatted_amenities} amenities")
        
        # Score proximity to UCR if relevant
        if preferences['near_ucr'] and listing.get('latitude') and listing.get('longitude'):
            # UCR coordinates
            ucr_lat, ucr_lng = 33.9737, -117.3281
            
            # Calculate rough distance (simplified)
            distance = ((listing.get('latitude') - ucr_lat) ** 2 + 
                        (listing.get('longitude') - ucr_lng) ** 2) ** 0.5
            
            # Convert to approximate miles (very rough estimation)
            miles = distance * 69
            
            if miles < 1:
                score += 15
                explanation.append("Very close to UCR (less than 1 mile)")
            elif miles < 2:
                score += 10
                explanation.append("Close to UCR (less than 2 miles)")
            elif miles < 5:
                score += 5
                explanation.append("Within 5 miles of UCR")
        
        # Keyword matching for description
        if preferences['keywords']:
            listing_description = listing.get('description', '').lower()
            listing_title = listing.get('title', '').lower()
            listing_tokens = self.preprocess_text(listing_description + ' ' + listing_title)
            
            # Count matching keywords
            matching_keywords = set(preferences['keywords']).intersection(set(listing_tokens))
            score += len(matching_keywords) * 2
            
            if len(matching_keywords) >= 3:
                explanation.append("Many of your keywords match the description")
            elif len(matching_keywords) > 0:
                explanation.append("Some of your keywords match the description")
        
        return {
            'score': score,
            'explanation': explanation
        }
    
    def find_matches(self, query, listings, top_n=5):
        """Find the top n listings that best match the user's query"""
        # Extract user preferences from the query
        preferences = self.extract_preferences(query)
        
        # Score all listings
        scored_listings = []
        for listing in listings:
            result = self.calculate_listing_score(listing, preferences)
            
            # Add the scored listing with its explanation
            scored_listings.append({
                'listing': listing,
                'score': result['score'],
                'explanation': result['explanation']
            })
        
        # Sort by score (descending)
        scored_listings.sort(key=lambda x: x['score'], reverse=True)
        
        # Return top N matches
        return scored_listings[:top_n]
    
    def generate_response(self, query, matches):
        """Generate a user-friendly response message with the matches"""
        if not matches:
            return "I couldn't find any listings matching your criteria. Please try a different search or adjust your requirements."
        
        # Extract user preferences for context
        preferences = self.extract_preferences(query)
        
        # Start building the response
        response = "Based on your search"
        
        # Add context to the response
        context_parts = []
        if preferences['bedrooms'] is not None:
            context_parts.append(f"{preferences['bedrooms']}-bedroom")
        elif preferences['min_bedrooms'] is not None and preferences['max_bedrooms'] is not None:
            context_parts.append(f"{preferences['min_bedrooms']}-{preferences['max_bedrooms']} bedroom")
        
        if preferences['property_type']:
            context_parts.append(preferences['property_type'])
        
        if context_parts:
            response += f" for a {' '.join(context_parts)}"
        
        if preferences['max_price']:
            response += f" with a budget of ${preferences['max_price']:,}"
        
        if preferences['amenities']:
            if len(preferences['amenities']) == 1:
                response += f" with {preferences['amenities'][0]}"
            else:
                formatted_amenities = ", ".join(preferences['amenities'][:-1]) + " and " + preferences['amenities'][-1]
                response += f" with {formatted_amenities}"
        
        if preferences['near_ucr']:
            response += " near UCR"
        
        response += ", here are the best matches I found:\n\n"
        
        # Add each match with its details and explanation
        for i, match in enumerate(matches, 1):
            listing = match['listing']
            score = match['score']
            explanation = match['explanation']
            
            response += f"**{i}. {listing.get('title')}** - ${listing.get('price'):,} per month\n"
            response += f"   {listing.get('bedrooms')} bed, {listing.get('bathrooms')} bath {listing.get('property_type')}\n"
            
            # Add some amenities if available
            amenities = listing.get('amenities', [])
            if amenities and len(amenities) > 0:
                sample_amenities = amenities[:3]
                response += f"   Amenities: {', '.join(sample_amenities)}"
                if len(amenities) > 3:
                    response += f" and {len(amenities) - 3} more"
                response += "\n"
            
            # Add match explanation
            if explanation:
                response += "   Why this matches: "
                if len(explanation) <= 2:
                    response += ", ".join(explanation)
                else:
                    # Limit to top 3 explanations to avoid overwhelmingly long responses
                    response += ", ".join(explanation[:3])
                    if len(explanation) > 3:
                        response += f" and {len(explanation) - 3} other factors"
                response += "\n"
            
            response += "\n"
        
        # Add a footer
        response += "Click on any listing to view more details or adjust your search criteria for different results."
        
        return response 