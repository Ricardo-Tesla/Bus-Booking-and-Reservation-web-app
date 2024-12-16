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
        toLowerCase: function(str) {
            if (typeof str !== 'string') return '';
            return str.toLowerCase();
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
        },
        now: function() {
            return new Date();
        },
        json: function(context) {
            return JSON.stringify(context);
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
    res.render('home');
});

app.get('/routes', (req, res) => {
    const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
    res.render('routes', { 
        routes: routesData.routes,
        pageTitle: 'Popular Routes'
    });
});

app.get('/about', (req, res) => {
    res.render('about', { 
        pageTitle: 'About Us'
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        pageTitle: 'Contact Us'
    });
});

app.get('/route/:id', (req, res) => {
    const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
    const route = routesData.routes.find(r => r.id === req.params.id);
    
    if (!route) {
        return res.status(404).render('error', {
            message: 'Route not found',
            error: { status: 404 }
        });
    }

    // Get today's day of the week in lowercase
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Get all departure times for today
    let departureTimes = route.schedule[today] || [];
    
    // Filter out times within one hour if the selected date is today
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Filter departure times
    departureTimes = departureTimes.filter(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const departureMinutes = hours * 60 + minutes;
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        return departureMinutes >= currentTotalMinutes + 60;
    });

    res.render('route-details', { 
        route,
        routeData: {
            id: route.id,
            from: route.from,
            to: route.to,
            seatLayout: route.seatLayout,
            rules: route.rules || routesData.businessRules,
            schedule: route.schedule,  // Send full schedule
            departureTimes: departureTimes, // Today's filtered times
            bookedSeats: route.bookedSeats || {}
        },
        pageTitle: `${route.from} to ${route.to}`
    });
});

app.get('/verify', (req, res) => {
    res.render('verify-booking');
});

app.post('/api/verify-booking', async (req, res) => {
    try {
        const { bookingReference, phone } = req.body;

        // Validate inputs
        if (!bookingReference || !phone) {
            return res.status(400).json({ 
                error: 'Booking reference and phone number are required' 
            });
        }

        // Sanitize inputs first
        const sanitizedRef = validation.sanitize.bookingReference(bookingReference);
        const sanitizedPhone = validation.sanitize.phone(phone);

        // Then validate
        if (!validation.validate.bookingReference(sanitizedRef)) {
            return res.status(400).json({ 
                error: validation.errors.bookingReference 
            });
        }
        if (!validation.validate.phone(sanitizedPhone)) {
            return res.status(400).json({ 
                error: validation.errors.phone 
            });
        }

        // Read bookings data
        const bookingsData = JSON.parse(fs.readFileSync('./data/bookings.json'));
        const booking = bookingsData.bookings.find(b => 
            b.id === sanitizedRef && b.phone === sanitizedPhone
        );

        if (!booking) {
            return res.status(404).json({ 
                error: 'No booking found with these details' 
            });
        }

        // Get route details
        const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const route = routesData.routes.find(r => r.id === booking.routeId);

        if (!route) {
            return res.status(404).json({ 
                error: 'Route information not found' 
            });
        }

        // Calculate total amount
        const totalAmount = booking.seats.reduce((total, seat) => {
            const price = seat.type === 'vip' ? 
                route.seatLayout.prices.vip : 
                route.seatLayout.prices.regular;
            return total + price;
        }, 0);

        // Return verified booking details
        res.json({
            success: true,
            booking: {
                reference: booking.id,
                route: {
                    from: route.from,
                    to: route.to
                },
                travelDate: booking.travelDate,
                departureTime: booking.departureTime,
                seats: booking.seats,
                passengerName: booking.fullName,
                bookingDate: booking.bookingDate,
                totalAmount: totalAmount
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ 
            error: 'An error occurred while verifying the booking' 
        });
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

app.get('/api/check-seats/:routeId/:dateTime', (req, res) => {
    try {
        const { routeId, dateTime } = req.params;
        const [date, time] = dateTime.split('_');
        
        // Read routes data
        const routesData = JSON.parse(fs.readFileSync('./data/routes.json'));
        const route = routesData.routes.find(r => r.id === routeId);
        
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // Get booked seats for the specified date and time
        const bookedSeats = route.bookedSeats[`${date}_${time}`] || [];

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

app.post('/api/bookings', async (req, res) => {
    try {
        const { routeId, seats, travelDate, departureTime, passengerDetails } = req.body;

        // Debug log
        console.log('Received booking request:', {
            routeId,
            seats,
            travelDate,
            departureTime,
            passengerDetails
        });

        // Validate all required fields with specific error messages
        if (!routeId) return res.status(400).json({ error: 'Route ID is required' });
        if (!seats || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ error: 'Selected seats are required' });
        }
        if (!travelDate) return res.status(400).json({ error: 'Travel date is required' });
        if (!departureTime) return res.status(400).json({ error: 'Departure time is required' });
        if (!passengerDetails) return res.status(400).json({ error: 'Passenger details are required' });
        if (!passengerDetails.fullName) return res.status(400).json({ error: 'Full name is required' });
        if (!passengerDetails.phone) return res.status(400).json({ error: 'Phone number is required' });
        if (!passengerDetails.email) return res.status(400).json({ error: 'Email is required' });

        // Validate using the validation module
        if (!validation.validate.name(passengerDetails.fullName)) {
            return res.status(400).json({ error: validation.errors.name });
        }
        if (!validation.validate.phone(passengerDetails.phone)) {
            return res.status(400).json({ error: validation.errors.phone });
        }
        if (!validation.validate.email(passengerDetails.email)) {
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
            seats,
            fullName: validation.sanitize.string(passengerDetails.fullName),
            phone: validation.sanitize.phone(passengerDetails.phone),
            email: validation.sanitize.email(passengerDetails.email),
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
        const route = routeData.routes.find(r => r.id === routeId);
        
        if (!route) {
            return res.status(400).json({ error: 'Invalid route selected' });
        }

        // Update booked seats for this date and time
        const bookingDateTimeKey = `${travelDate}_${departureTime}`;
        if (!route.bookedSeats[bookingDateTimeKey]) {
            route.bookedSeats[bookingDateTimeKey] = [];
        }
        
        seats.forEach(seat => {
            route.bookedSeats[bookingDateTimeKey].push(seat.number);
        });

        // Save updated routes data
        fs.writeFileSync('./data/routes.json', JSON.stringify(routeData, null, 2));

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Booking confirmed successfully',
            booking: {
                id: bookingReference,
                routeId,
                travelDate,
                departureTime,
                seats,
                fullName: validation.sanitize.string(passengerDetails.fullName),
                phone: validation.sanitize.phone(passengerDetails.phone),
                email: validation.sanitize.email(passengerDetails.email),
                bookingDate: new Date()
            }
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Server error during booking' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 