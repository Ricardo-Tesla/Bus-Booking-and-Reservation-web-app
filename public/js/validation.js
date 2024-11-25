(function(exports) {
    const validation = {
        patterns: {
            phone: /^(?:254|\+254|0)?[71]\d{8}$/,
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            name: /^[A-Za-z\s]{2,50}$/,
            bookingReference: /^BK[A-Z0-9]{10}$/
        },

        sanitize: {
            string: function(str) {
                return str.trim()
                    .replace(/[<>]/g, '')
                    .slice(0, 100);
            },
            
            phone: function(phone) {
                return phone.replace(/[^0-9+]/g, '');
            },

            email: function(email) {
                return email.trim().toLowerCase();
            }
        },

        validate: {
            phone: function(phone) {
                return validation.patterns.phone.test(phone);
            },

            email: function(email) {
                return validation.patterns.email.test(email);
            },

            name: function(name) {
                return validation.patterns.name.test(name);
            },

            bookingReference: function(ref) {
                return validation.patterns.bookingReference.test(ref);
            },

            seats: function(seats, maxSeats) {
                return seats && 
                       Array.isArray(seats) && 
                       seats.length > 0 && 
                       seats.length <= maxSeats;
            }
        },

        errors: {
            phone: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
            email: "Please enter a valid email address",
            name: "Name should only contain letters and spaces (2-50 characters)",
            seats: "Please select at least one seat",
            bookingReference: "Invalid booking reference format"
        }
    };

    // Make it work in both browser and Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = validation;
    } else {
        exports.validation = validation;
    }
})(typeof exports === 'undefined' ? this : exports); 