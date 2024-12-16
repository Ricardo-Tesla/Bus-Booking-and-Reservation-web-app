// Utility functions for the application
const utils = {
    // Show loading overlay
    showLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },

    // Hide loading overlay
    hideLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    // Show toast notification
    showToast: function(title, message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        const progressBar = toast.querySelector('.toast-progress-bar');
        
        if (!toast || !toastTitle || !toastMessage) {
            console.warn('Toast elements not found');
            return;
        }
        
        // Remove existing classes
        toast.className = 'toast';
        
        // Add type class
        toast.classList.add(type);
        
        // Update content
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        // Reset and start progress bar
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = 'width 5s linear';
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 100);
        }
        
        // Show toast
        bsToast.show();
        
        // Add show class for animation
        toast.classList.add('show');
        
        // Clean up
        toast.addEventListener('hidden.bs.toast', () => {
            toast.classList.remove('show');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transition = 'none';
            }
        });
    },

    // Form validation
    validateForm: function(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
                
                // Create or update feedback message
                let feedback = field.nextElementSibling;
                if (!feedback?.classList.contains('invalid-feedback')) {
                    feedback = document.createElement('div');
                    feedback.classList.add('invalid-feedback');
                    field.parentNode.insertBefore(feedback, field.nextSibling);
                }
                feedback.textContent = `${field.getAttribute('name')} is required`;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    },

    // Format currency
    formatCurrency: function(amount) {
        return `KES ${amount.toLocaleString()}`;
    },

    // Format date and time
    formatDateTime: function(dateString) {
        return new Date(dateString).toLocaleString('en-KE');
    },

    handleError: function(error) {
        console.error('Error:', error);
        
        let message = 'An error occurred';
        if (error.response) {
            message = error.response.data || 'Server error';
        } else if (error.message) {
            message = error.message;
        }

        this.showToast('Error', message, 'error');
    },

    validateBookingTime: function(departureTime) {
        const [hours, minutes] = departureTime.split(':');
        const departure = new Date();
        departure.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const minTimeBeforeDeparture = new Date(
            departure.getTime() - (routeData.rules.minBookingHours * 60 * 60 * 1000)
        );
        
        return new Date() <= minTimeBeforeDeparture;
    },

    calculateHoursDifference: function(date1, date2) {
        return Math.abs(date1 - date2) / (1000 * 60 * 60);
    },

    isValidBookingTime: function(departureDateTime, minHours = 1) {
        const now = new Date();
        const hoursDifference = this.calculateHoursDifference(departureDateTime, now);
        return hoursDifference >= minHours;
    },

    validateSeatSelection: function(selectedSeats, maxSeats = 5) {
        if (!Array.isArray(selectedSeats)) {
            return false;
        }
        
        if (selectedSeats.length === 0) {
            return false;
        }
        
        if (selectedSeats.length > maxSeats) {
            this.showToast('Error', `Maximum ${maxSeats} seats allowed per booking`, 'error');
            return false;
        }
        
        return true;
    }
}; 