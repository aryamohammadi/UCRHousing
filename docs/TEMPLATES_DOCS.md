# Templates Directory Documentation

The `templates` directory contains all the Jinja2 HTML templates that define the application's user interface. The templates are organized by feature and follow a hierarchical structure with a base template that all other templates inherit from.

## Directory Structure

```
templates/
├── base.html            # Base template with layout and common elements
├── home/                # Homepage templates
│   ├── index.html       # Main landing page with map and listing overview
│   └── _filters.html    # Filters component for the homepage
├── listing/             # Listing detail templates
│   ├── detail.html      # Individual listing view
│   ├── new.html         # Form for creating a new listing
│   └── edit.html        # Form for editing an existing listing
├── chat/                # Chat interface templates
│   └── index.html       # Rule-based matching chat interface
└── admin/               # Admin interface templates
    ├── dashboard.html   # Admin dashboard
    ├── listings.html    # Listing management
    ├── import.html      # Data import interface
    └── export.html      # Data export interface
```

## Key Templates

### base.html

The base template that all other templates extend:

- Defines the HTML structure
- Includes common CSS and JavaScript
- Provides the navigation header
- Includes the responsive footer
- Handles dark/light mode toggle
- Defines common UI components and utility classes

### home/index.html

The main landing page:

- Interactive Google Maps integration
- Listing cards in a responsive grid
- Filtering sidebar
- Map controls (view toggle, zoom)
- Loading states and error handling

### listing/detail.html

Individual listing view:

- Property details and description
- Google Maps with property location
- Distance calculations to UCR (walking and driving)
- Amenities display
- Contact information
- Edit/delete controls for owners

### chat/index.html

Rule-based matching chat interface:

- Chat message container
- User input form
- Result formatting with Markdown support
- Suggested listing cards
- Typing indicator and loading states

### admin/dashboard.html

Admin dashboard:

- Summary statistics
- Quick action buttons
- Recent activity
- System status

## Template Features

### Responsive Design

All templates use responsive design principles:

- Mobile-first approach
- Breakpoints for different screen sizes
- Grid and flexbox layouts
- Responsive navigation

### Theming

Templates support light and dark mode:

- Color variables
- Theme toggle in navigation
- System preference detection
- Persistent theme preference storage

### Components

Common UI components used across templates:

- Cards for listing display
- Form elements with consistent styling
- Buttons with various states
- Alerts and notifications
- Loading indicators
- Modal dialogs

### Data Handling

Templates include patterns for data display:

- Conditional rendering
- List iteration
- Empty state handling
- Error message display

## Usage Notes

- Templates use Tailwind CSS for styling
- JavaScript is included inline or linked from the static directory
- SVG icons are used for better scaling and theming support
- Form validation combines frontend and backend validation
- Interactive elements use progressive enhancement
