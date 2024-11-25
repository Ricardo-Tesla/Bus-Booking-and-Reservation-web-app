const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const validation = require('./public/js/validation.js');

const app = express();
const port = 3000;

// Handlebars setup with helpers
const hbs = exphbs.create({
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        capitalize: function(str) {
            if (typeof str !== 'string') return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },
        formatDate: function(date) {
            return new Date(date).toLocaleDateString();
        },
        formatTime: function(time) {
            return time;
        },
        formatCurrency: function(amount) {
            return `KES ${amount.toLocaleString()}`;
        },
        eq: function(a, b) {
            return a === b;
        }
    }
});

// Update the engine setup to use the created instance
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
    
    // Calculate available seats for each route
    const routes = routesData.routes.map(route => {
        // Calculate total seats
        const totalSeats = route.seatLayout.totalRows * route.seatLayout.seatsPerRow;
        
        // Get all booked seats across all dates and times
        const bookedSeatsCount = Object.values(route.bookedSeats || {})
            .flat() // Flatten the arrays of booked seats
            .length;
        
        // Calculate available seats
        const availableSeats = totalSeats - bookedSeatsCount;
        
        return {
            ...route,
            availableSeats: availableSeats
        };
    });

    res.render('home', { routes });
});

app.get('/route/:id', (req, res) => {
    const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
    const route = routesData.routes.find(r => r.id === req.params.id);
    
    if (!route) {
        return res.status(404).render('error', { message: 'Route not found' });
    }

    // Ensure route has rules defined
    route.rules = {
        maxSeatsPerBooking: routesData.businessRules.maxSeatsPerBooking || 5,
        minBookingHours: routesData.businessRules.minBookingHours || 1
    };

    res.render('route-details', { 
        route,
        routeJSON: JSON.stringify(route),
        businessRules: routesData.businessRules
    });
});

app.post('/book', async (req, res) => {
    try {
        const { routeId, selectedSeats, departureTime, travelDate, fullName, phone, email } = req.body;

        // Validate all required fields
        if (!routeId || !selectedSeats || !departureTime || !travelDate || !fullName || !phone || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate using the validation module
        if (!validation.validate.name(fullName)) {
            return res.status(400).json({ error: validation.errors.name });
        }
        if (!validation.validate.phone(phone)) {
            return res.status(400).json({ error: validation.errors.phone });
        }
        if (!validation.validate.email(email)) {
            return res.status(400).json({ error: validation.errors.email });
        }

        // Create booking reference
        const bookingReference = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

        // Create booking object with sanitized data
        const booking = {
            id: bookingReference,
            routeId,
            travelDate,
            departureTime,
            seats: selectedSeats,
            fullName: validation.sanitize.string(fullName),
            phone: validation.sanitize.phone(phone),
            email: validation.sanitize.email(email),
            bookingDate: new Date()
        };

        // Read and update bookings
        const bookingsPath = './data/bookings.json';
        let bookingsData = { bookings: [] };
        
        if (fs.existsSync(bookingsPath)) {
            bookingsData = JSON.parse(fs.readFileSync(bookingsPath));
        }

        // Add new booking
        bookingsData.bookings.push(booking);

        // Save updated bookings
        fs.writeFileSync(bookingsPath, JSON.stringify(bookingsData, null, 2));

        // Update route's booked seats
        let routeData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const selectedRoute = routeData.routes.find(r => r.id === routeId);
        
        if (!selectedRoute) {
            return res.status(400).json({ error: 'Invalid route selected' });
        }

        // Update booked seats for this date and time
        const bookingDateTimeKey = `${travelDate}_${departureTime}`;
        if (!selectedRoute.bookedSeats[bookingDateTimeKey]) {
            selectedRoute.bookedSeats[bookingDateTimeKey] = [];
        }
        
        selectedSeats.forEach(seat => {
            selectedRoute.bookedSeats[bookingDateTimeKey].push(seat.number);
        });

        // Save updated routes data
        fs.writeFileSync('./data/routes.json', JSON.stringify(routeData, null, 2));

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Booking confirmed successfully',
            booking: booking
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Server error during booking' });
    }
});

app.get('/verify', (req, res) => {
    res.render('verify-booking');
});

app.post('/api/verify-booking', (req, res) => {
    try {
        const { bookingReference, phone } = req.body;

        // Validate inputs
        if (!validation.validate.bookingReference(bookingReference)) {
            return res.status(400).json({ error: validation.errors.bookingReference });
        }
        if (!validation.validate.phone(phone)) {
            return res.status(400).json({ error: validation.errors.phone });
        }

        // Sanitize inputs
        const sanitizedPhone = validation.sanitize.phone(phone);

        // Read bookings
        const bookingsData = JSON.parse(fs.readFileSync('./data/bookings.json'));
        const booking = bookingsData.bookings.find(b => 
            b.id === bookingReference && b.phone === sanitizedPhone
        );

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Get route details
        const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const route = routesData.routes.find(r => r.id === booking.routeId);

        res.json({
            booking: {
                reference: booking.id,
                route: {
                    from: route.from,
                    to: route.to
                },
                departureTime: booking.departureTime,
                seats: booking.seats,
                passengerName: booking.fullName,
                bookingDate: booking.bookingDate
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/manage-booking', (req, res) => {
    res.render('manage-booking');
});

app.post('/api/cancel-booking', (req, res) => {
    try {
        const { bookingReference, phone } = req.body;
        
        // Read bookings
        const bookingsData = JSON.parse(fs.readFileSync('./data/bookings.json'));
        const bookingIndex = bookingsData.bookings.findIndex(b => 
            b.id === bookingReference && b.phone === phone
        );

        if (bookingIndex === -1) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingsData.bookings[bookingIndex];
        
        // Check if cancellation is allowed (2 hours before departure)
        const departureTime = new Date(`${booking.travelDate} ${booking.departureTime}`);
        const now = new Date();
        const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilDeparture < 2) {
            return res.status(400).json({ 
                error: 'Cancellations must be made at least 2 hours before departure' 
            });
        }

        // Remove booking
        bookingsData.bookings.splice(bookingIndex, 1);
        fs.writeFileSync('./data/bookings.json', JSON.stringify(bookingsData, null, 2));

        // Update route's booked seats
        const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const route = routesData.routes.find(r => r.id === booking.routeId);
        const dateTimeKey = `${booking.travelDate}_${booking.departureTime}`;
        
        route.bookedSeats[dateTimeKey] = route.bookedSeats[dateTimeKey].filter(
            seatNumber => !booking.seats.find(s => s.number === seatNumber)
        );
        
        fs.writeFileSync('./data/routes.json', JSON.stringify(routesData, null, 2));

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/check-seats', (req, res) => {
    try {
        const { routeId, dateTimeKey } = req.body;
        
        // Read routes data
        const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const route = routesData.routes.find(r => r.id === routeId);
        
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // Get booked seats for the specified date and time
        const bookedSeats = route.bookedSeats[dateTimeKey] || [];

        res.json({
            success: true,
            bookedSeats: bookedSeats
        });
    } catch (error) {
        console.error('Error checking seats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/booking-confirmation/:id', (req, res) => {
    try {
        // Read bookings data
        const bookingsData = JSON.parse(fs.readFileSync('./data/bookings.json'));
        const booking = bookingsData.bookings.find(b => b.id === req.params.id);
        
        if (!booking) {
            return res.status(404).render('error', { 
                message: 'Booking not found',
                error: { status: 404 }
            });
        }

        // Get route details
        const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const route = routesData.routes.find(r => r.id === booking.routeId);

        if (!route) {
            return res.status(404).render('error', { 
                message: 'Route not found',
                error: { status: 404 }
            });
        }

        // Calculate total amount
        const totalAmount = booking.seats.reduce((total, seat) => {
            const price = seat.type === 'vip' ? 
                route.seatLayout.prices.vip : 
                route.seatLayout.prices.regular;
            return total + price;
        }, 0);

        // Render the confirmation page
        res.render('booking-confirmation', { 
            booking,
            route,
            totalAmount,
            formatDate: date => new Date(date).toLocaleDateString(),
            formatTime: time => time
        });

    } catch (error) {
        console.error('Error in booking confirmation:', error);
        res.status(500).render('error', { 
            message: 'Server error',
            error: { status: 500 }
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 