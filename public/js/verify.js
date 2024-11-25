document.addEventListener('DOMContentLoaded', function() {
    const verifyForm = document.getElementById('verifyForm');
    const bookingDetails = document.getElementById('bookingDetails');
    const bookingInfo = document.getElementById('bookingInfo');

    verifyForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const bookingReference = document.getElementById('bookingReference').value;
        const phoneNumber = document.getElementById('phoneNumber').value;

        // Validate inputs
        if (!validation.validate.bookingReference(bookingReference)) {
            utils.showToast('Error', validation.errors.bookingReference, 'error');
            return;
        }
        if (!validation.validate.phone(phoneNumber)) {
            utils.showToast('Error', validation.errors.phone, 'error');
            return;
        }

        utils.showLoading();

        try {
            const response = await fetch('/api/verify-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingReference: bookingReference,
                    phone: phoneNumber
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            // Display booking details
            displayBookingDetails(data.booking);
            bookingDetails.style.display = 'block';
            utils.showToast('Success', 'Booking verified successfully', 'success');

        } catch (error) {
            utils.showToast('Error', error.message, 'error');
            bookingDetails.style.display = 'none';
        } finally {
            utils.hideLoading();
        }
    });

    function displayBookingDetails(booking) {
        const formattedDate = new Date(booking.bookingDate).toLocaleString();
        bookingInfo.innerHTML = `
            <div class="booking-info">
                <p><strong>Reference:</strong> ${booking.reference}</p>
                <p><strong>Route:</strong> ${booking.route.from} to ${booking.route.to}</p>
                <p><strong>Departure:</strong> ${booking.departureTime}</p>
                <p><strong>Passenger:</strong> ${booking.passengerName}</p>
                <p><strong>Seats:</strong> ${booking.seats.map(s => `${s.number} (${s.type})`).join(', ')}</p>
                <p><strong>Booking Date:</strong> ${formattedDate}</p>
            </div>
        `;
    }
}); 