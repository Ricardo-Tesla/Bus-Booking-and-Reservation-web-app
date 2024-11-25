const dateTimeHandler = {
    init: function() {
        if (!document.getElementById('seatMap')) {
            return;
        }

        this.travelDateInput = document.getElementById('travelDate');
        this.departureTimeSelect = document.getElementById('departureTime');
        
        if (typeof routeData === 'undefined') {
            console.error('Route data not available');
            return;
        }
        
        if (!routeData.rules) {
            routeData.rules = {
                maxSeatsPerBooking: 5,
                minBookingHours: 1
            };
        }
        
        if (this.travelDateInput && this.departureTimeSelect) {
            this.setupDateConstraints();
            this.setupEventListeners();
        }
    },

    setupDateConstraints: function() {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 30);

        this.travelDateInput.min = today.toISOString().split('T')[0];
        this.travelDateInput.max = maxDate.toISOString().split('T')[0];
        this.travelDateInput.value = today.toISOString().split('T')[0];
        
        // Trigger initial date change
        this.handleDateChange();
    },

    setupEventListeners: function() {
        this.travelDateInput.addEventListener('change', () => this.handleDateChange());
        this.departureTimeSelect.addEventListener('change', () => this.handleTimeChange());
    },

    handleDateChange: function() {
        const selectedDate = new Date(this.travelDateInput.value);
        if (!selectedDate || isNaN(selectedDate.getTime())) {
            this.departureTimeSelect.disabled = true;
            this.departureTimeSelect.innerHTML = '<option value="">Select date first</option>';
            return;
        }

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = days[selectedDate.getDay()];
        const availableTimes = routeData.schedule[dayOfWeek];

        let filteredTimes = availableTimes;
        if (this.isToday(selectedDate)) {
            const now = new Date();
            const minBookingHours = routeData.rules?.minBookingHours || 1;
            
            filteredTimes = availableTimes.filter(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const timeToCheck = new Date(selectedDate);
                timeToCheck.setHours(hours, minutes, 0, 0);
                
                // Calculate hours difference
                const hoursDifference = (timeToCheck - now) / (1000 * 60 * 60);
                return hoursDifference >= minBookingHours;
            });
        }

        this.departureTimeSelect.innerHTML = filteredTimes.length > 0 
            ? filteredTimes.map(time => 
                `<option value="${time}">${time}</option>`
            ).join('')
            : '<option value="">No available times</option>';
            
        this.departureTimeSelect.disabled = filteredTimes.length === 0;

        if (filteredTimes.length > 0) {
            this.handleTimeChange();
        }
    },

    handleTimeChange: function() {
        const selectedDate = this.travelDateInput.value;
        const selectedTime = this.departureTimeSelect.value;
        
        if (selectedDate && selectedTime) {
            const dateTimeKey = `${selectedDate}_${selectedTime}`;
            if (typeof updateBookedSeats === 'function') {
                updateBookedSeats(dateTimeKey);
            }
        }
    },

    isToday: function(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    getSelectedDateTime: function() {
        return {
            date: this.travelDateInput.value,
            time: this.departureTimeSelect.value
        };
    },

    validateBookingTime: function(selectedDate, selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(hours, minutes, 0, 0);
        
        const now = new Date();
        const hoursDifference = (selectedDateTime - now) / (1000 * 60 * 60);
        
        return hoursDifference >= (routeData.rules?.minBookingHours || 1);
    }
}; 