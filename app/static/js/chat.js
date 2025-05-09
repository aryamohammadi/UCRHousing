/**
 * UCR HousingConnect - Chat Interface
 * Handles ChatGPT integration for housing recommendations
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const suggestedListings = document.getElementById('suggested-listings');
    const listingsContainer = document.getElementById('listings-container');
    const listingTemplate = document.getElementById('listing-template');
    
    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input
        userInput.value = '';
        
        // Show loading indicator
        addLoadingMessage();
        
        // Send message to server
        sendMessage(message);
    });
    
    // Function to add a message to the chat
    function addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start chat-message-enter';
        
        // Add appropriate avatar and styling based on sender
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="flex-shrink-0 mr-3 order-2 ml-3">
                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                        U
                    </div>
                </div>
                <div class="bg-blue-500 text-white rounded-lg p-3 max-w-[80%] order-1 ml-auto">
                    <p>${escapeHTML(text)}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex-shrink-0 mr-3">
                    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        A
                    </div>
                </div>
                <div class="bg-blue-100 rounded-lg p-3 max-w-[80%]">
                    <p>${text}</p>
                </div>
            `;
        }
        
        // Add message to chat and scroll to bottom
        chatMessages.appendChild(messageDiv);
        
        // Animate entry
        setTimeout(() => {
            messageDiv.classList.remove('chat-message-enter');
        }, 10);
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to add a loading message
    function addLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'flex items-start loading-message chat-message-enter';
        loadingDiv.innerHTML = `
            <div class="flex-shrink-0 mr-3">
                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    A
                </div>
            </div>
            <div class="bg-blue-100 rounded-lg p-3 max-w-[80%] flex items-center">
                <span class="dot-typing"></span>
            </div>
        `;
        
        chatMessages.appendChild(loadingDiv);
        
        // Animate entry
        setTimeout(() => {
            loadingDiv.classList.remove('chat-message-enter');
        }, 10);
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingDiv;
    }
    
    // Function to send a message to the server
    async function sendMessage(message) {
        try {
            const response = await fetch('/chat/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            // Remove loading message
            const loadingMessage = document.querySelector('.loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
            
            // Add assistant's response
            addMessageToChat('assistant', data.message);
            
            // Display suggested listings if available
            if (data.listings && data.listings.length > 0) {
                displayListings(data.listings);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Remove loading message
            const loadingMessage = document.querySelector('.loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
            
            // Add error message
            addMessageToChat('assistant', 'Sorry, I encountered an error while processing your request. Please try again later.');
        }
    }
    
    // Function to display suggested listings
    function displayListings(listings) {
        // Clear previous listings
        listingsContainer.innerHTML = '';
        
        // Add each listing
        listings.forEach(listing => {
            const template = listingTemplate.content.cloneNode(true);
            
            template.querySelector('.listing-title').textContent = listing.title;
            template.querySelector('.listing-price').textContent = `$${listing.price.toFixed(2)}`;
            template.querySelector('.listing-address').textContent = listing.address;
            template.querySelector('.listing-bedrooms').textContent = `${listing.bedrooms} bed`;
            template.querySelector('.listing-bathrooms').textContent = `${listing.bathrooms} bath`;
            template.querySelector('.listing-property-type').textContent = listing.property_type;
            
            const link = template.querySelector('.listing-link');
            link.href = `/listing/${listing.id}`;
            
            listingsContainer.appendChild(template);
        });
        
        // Show the listings section
        suggestedListings.classList.remove('hidden');
    }
    
    // Helper function to escape HTML
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
    }
    
    // Add typing animation CSS
    const style = document.createElement('style');
    style.textContent = `
        .dot-typing {
            position: relative;
            width: 4px;
            height: 4px;
            border-radius: 2px;
            background-color: #3B82F6;
            animation: dotTyping 1.5s infinite linear;
        }
        
        .dot-typing::before,
        .dot-typing::after {
            content: '';
            display: inline-block;
            position: absolute;
            top: 0;
            width: 4px;
            height: 4px;
            border-radius: 2px;
            background-color: #3B82F6;
            animation: dotTyping 1.5s infinite linear;
        }
        
        .dot-typing::before {
            left: -8px;
            animation-delay: 0s;
        }
        
        .dot-typing::after {
            left: 8px;
            animation-delay: 0.75s;
        }
        
        @keyframes dotTyping {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}); 