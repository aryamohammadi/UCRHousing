# Rule-Based Matching System Documentation

This document describes the rule-based matching system defined in `matching.py` that powers the housing recommendation feature of UCR HousingConnect.

## Overview

The matching system uses natural language processing (NLP) techniques to understand user queries, extract housing preferences, and match them against available listings. It replaces the OpenAI-based chat system with a fully local solution that doesn't require external API calls.

## System Components

The system is encapsulated in the `ListingMatcher` class with these main components:

1. **Text Preprocessing**: Normalizes and tokenizes user queries
2. **Preference Extraction**: Identifies housing requirements from natural language
3. **Listing Scoring**: Ranks properties based on match quality
4. **Response Generation**: Creates user-friendly explanations

## ListingMatcher Class

```python
class ListingMatcher:
    """Rule-based system for matching user queries to housing listings"""
```

### Key Methods

| Method                      | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `preprocess_text()`         | Normalizes text using tokenization, stemming, and stop word removal |
| `extract_preferences()`     | Extracts structured preferences from natural language queries       |
| `calculate_listing_score()` | Scores how well a listing matches user preferences                  |
| `find_matches()`            | Returns top N listings ranked by relevance                          |
| `generate_response()`       | Creates a formatted response with matches and explanations          |

## Preference Extraction

The system can extract these preference types:

| Preference    | Example Phrases                | Implementation                               |
| ------------- | ------------------------------ | -------------------------------------------- |
| Bedrooms      | "2-bedroom", "2 bed", "2 BR"   | Regular expressions                          |
| Bathrooms     | "1.5 bath", "2 bathrooms"      | Regular expressions                          |
| Price         | "under $1500", "$1000-$1500"   | Regular expressions with price normalization |
| Property Type | "apartment", "house", "room"   | Keyword matching                             |
| Amenities     | "with parking", "pet-friendly" | Keyword matching against defined amenities   |
| Location      | "near UCR", "close to campus"  | Keyword matching                             |

### Example Extracted Preferences

From a query like "I need a 2-bedroom apartment near UCR under $1500 with parking and laundry", the system extracts:

```python
{
    'bedrooms': 2,
    'min_bedrooms': None,
    'max_bedrooms': None,
    'bathrooms': None,
    'min_bathrooms': None,
    'max_bathrooms': None,
    'min_price': None,
    'max_price': 1500,
    'property_type': 'apartment',
    'amenities': ['parking', 'laundry'],
    'near_ucr': True,
    'keywords': ['need', 'bedroom', 'apartment', 'near', 'ucr', 'under', 'parking', 'laundry']
}
```

## Scoring Algorithm

Listings are scored based on how well they match the extracted preferences:

| Criteria                    | Points       | Implementation             |
| --------------------------- | ------------ | -------------------------- |
| Exact bedroom match         | +10          | Direct comparison          |
| Close bedroom match (±1)    | +5           | Tolerance range            |
| Exact bathroom match        | +8           | Direct comparison          |
| Price within budget         | +15          | Range comparison           |
| Price slightly over budget  | +3           | Percentage-based tolerance |
| Property type match         | +8           | Direct comparison          |
| Each matched amenity        | +5           | Keyword matching           |
| Very close to UCR (<1 mile) | +15          | Distance calculation       |
| Close to UCR (<2 miles)     | +10          | Distance calculation       |
| Within 5 miles of UCR       | +5           | Distance calculation       |
| Keyword matches             | +2 per match | Stemmed token comparison   |

Penalties are applied for significant mismatches (e.g., many bedrooms difference, price far above budget).

## Response Generation

The system generates human-readable responses that include:

1. A summary of the understood query
2. The top matching listings with details (price, bedrooms, etc.)
3. Explanations of why each listing matches the query
4. A selection of relevant amenities

Example response snippet:

```
Based on your search for a 2-bedroom apartment near UCR with a budget of $1,500 with parking and laundry, here are the best matches I found:

**1. Cozy 2BD Near UCR** - $1,450 per month
   2 bed, 1 bath apartment
   Amenities: Parking, In-unit laundry, Air conditioning
   Why this matches: Exactly 2 bedrooms as requested, Within your maximum budget, Very close to UCR (less than 1 mile)

**2. University Village Apartments** - $1,550 per month
   2 bed, 2 bath apartment
   Amenities: Covered parking, Laundry facilities, Pool
   Why this matches: Exactly 2 bedrooms as requested, Slightly over your maximum budget, Close to UCR (less than 2 miles)
```

## Integration with Flask

The matching system is initialized in the `chat.py` routes file:

```python
from app.matching import ListingMatcher

# Initialize the rule-based matching system
matcher = ListingMatcher()
```

The `/chat/ask` endpoint uses the matcher to process queries:

```python
@chat_bp.route('/ask', methods=['POST'])
def ask():
    # ...
    matches = matcher.find_matches(user_message, listings_data, top_n=5)
    response_message = matcher.generate_response(user_message, matches)
    # ...
```

## Performance Considerations

- The system uses lightweight NLP techniques to avoid heavy computational requirements
- NLTK data is downloaded during app initialization if not already available
- Fallback mechanisms exist for when NLTK data isn't available
- Simple distance calculations avoid expensive API calls
