// Utility functions for the application
const utils = {
    // Show loading overlay
    showLoading: function() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    },

    // Hide loading overlay
    hideLoading: function() {
        document.getElementById('loadingOverlay').style.display = 'none';
    },

    // Show toast notification
    showToast: function(title, message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Remove existing classes
        toast.classList.remove('bg-success', 'bg-danger', 'bg-info');
        
        // Add appropriate class based on type
        switch(type) {
            case 'success':
                toast.classList.add('bg-success', 'text-white');
                break;
            case 'error':
                toast.classList.add('bg-danger', 'text-white');
                break;
            default:
                toast.classList.add('bg-info', 'text-white');
        }
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
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