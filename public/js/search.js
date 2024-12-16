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
    const noResults = document.getElementById('noResults');

    function filterRoutes() {
        const searchTerm = searchInput?.value.toLowerCase().trim() || '';
        const selectedTime = timeFilter?.value || '';
        const selectedPrice = priceFilter?.value || '';
        
        const routeCards = document.querySelectorAll('.route-card');
        let visibleCount = 0;

        routeCards.forEach(card => {
            try {
                // Improved route text extraction
                const routeHeader = card.querySelector('.route-header .card-title');
                let from = '', to = '';
                
                if (routeHeader) {
                    // Extract text between markers
                    const markers = routeHeader.querySelectorAll('.fas.fa-map-marker-alt');
                    if (markers.length >= 2) {
                        from = markers[0].nextSibling?.textContent.trim().toLowerCase() || '';
                        to = markers[1].nextSibling?.textContent.trim().toLowerCase() || '';
                    }
                }

                // Extract price
                const priceElement = card.querySelector('.price-amount');
                const priceText = priceElement ? priceElement.textContent : '0';
                const priceMatch = /\d+/.exec(priceText);
                const price = parseInt(priceMatch ? priceMatch[0] : '0');
                
                // Extract times
                const timeBadges = card.querySelectorAll('.time-badges .badge');
                const times = Array.from(timeBadges).map(badge => badge.textContent.trim());

                // Search filter
                let isVisible = true;
                if (searchTerm) {
                    isVisible = from.includes(searchTerm) || to.includes(searchTerm);
                }

                // Price filter
                if (isVisible && selectedPrice) {
                    switch(selectedPrice) {
                        case '0-500':
                            isVisible = price <= 500;
                            break;
                        case '501-1000':
                            isVisible = price > 500 && price <= 1000;
                            break;
                        case '1001+':
                            isVisible = price > 1000;
                            break;
                    }
                }

                // Time filter
                if (isVisible && selectedTime) {
                    isVisible = times.some(time => {
                        const hour = parseInt(time.split(':')[0] || '0');
                        switch(selectedTime) {
                            case 'morning':
                                return hour >= 6 && hour < 12;
                            case 'afternoon':
                                return hour >= 12 && hour < 18;
                            case 'evening':
                                return hour >= 18 || hour < 6;
                            default:
                                return true;
                        }
                    });
                }

                // Update visibility
                card.style.display = isVisible ? '' : 'none';
                if (isVisible) visibleCount++;

            } catch (error) {
                console.error('Error processing card:', error);
                card.style.display = ''; // Show card in case of error
                visibleCount++;
            }
        });

        // Update no results message
        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        if (DEBUG) {
            console.log('Filter applied:', {
                searchTerm,
                selectedTime,
                selectedPrice,
                visibleCount
            });
        }
    }

    // Add event listeners
    searchInput?.addEventListener('input', filterRoutes);
    timeFilter?.addEventListener('change', filterRoutes);
    priceFilter?.addEventListener('change', filterRoutes);

    // Reset filters function
    window.resetFilters = function() {
        if (searchInput) searchInput.value = '';
        if (timeFilter) timeFilter.value = '';
        if (priceFilter) priceFilter.value = '';
        filterRoutes();
    }

    // Initial filter
    filterRoutes();
}); 