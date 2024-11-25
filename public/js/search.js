const DEBUG = true;

function log(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const timeFilter = document.getElementById('timeFilter');
    const priceFilter = document.getElementById('priceFilter');
    const routeCards = document.querySelectorAll('.route-card');
    const noResults = document.getElementById('noResults');

    function filterRoutes() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedTime = timeFilter.value;
        const selectedPrice = priceFilter.value;

        let visibleCount = 0;

        routeCards.forEach(card => {
            // Extract all necessary data from the card
            const routeTitle = card.querySelector('.card-title').textContent.toLowerCase();
            const regularPrice = parseInt(card.querySelector('.regular-price').textContent);
            const departureTimes = Array.from(card.querySelectorAll('.badge')).map(b => b.textContent);
            
            // Start with true and set to false if any filter fails
            let isVisible = true;

            // Search filter (match route name, from, or to)
            if (searchTerm !== '') {
                isVisible = routeTitle.includes(searchTerm);
            }

            // Price filter with more granular ranges
            if (selectedPrice !== '') {
                switch(selectedPrice) {
                    case '501-1000':
                        isVisible = isVisible && (regularPrice >= 501 && regularPrice <= 1000);
                        break;
                    case '1001+':
                        isVisible = isVisible && regularPrice > 1000;
                        break;
                }
            }

            // Time filter with better time parsing
            if (selectedTime !== '') {
                isVisible = isVisible && departureTimes.some(time => {
                    const hour = parseInt(time.split(':')[0]);
                    switch(selectedTime) {
                        case 'morning':
                            return hour >= 6 && hour < 12;
                        case 'afternoon':
                            return hour >= 12 && hour < 18;
                        case 'evening':
                            return hour >= 18 || hour < 6; // Include late night/early morning
                    }
                    return false;
                });
            }

            // Update card visibility
            card.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;

            // Debug logging
            if (DEBUG) {
                console.log('Route:', routeTitle);
                console.log('Price:', regularPrice);
                console.log('Times:', departureTimes);
                console.log('Visible:', isVisible);
                console.log('---');
            }
        });

        // Show/hide no results message
        if (document.getElementById('noResults')) {
            document.getElementById('noResults').style.display = 
                visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Add event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterRoutes);
    }
    if (timeFilter) {
        timeFilter.addEventListener('change', filterRoutes);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', filterRoutes);
    }

    // Initial filter
    filterRoutes();
}); 