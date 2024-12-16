document.addEventListener('DOMContentLoaded', function() {
    const verifyForm = document.getElementById('verifyForm');
    const bookingDetails = document.getElementById('bookingDetails');

    verifyForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!this.checkValidity()) {
            e.stopPropagation();
            this.classList.add('was-validated');
            return;
        }

        const bookingReference = document.getElementById('bookingReference').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const bookingInfo = document.getElementById('bookingInfo');

        try {
            utils.showLoading();
            
            const response = await fetch('/api/verify-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    bookingReference: bookingReference.trim(),
                    phone: phoneNumber.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Update the booking details display
            if (bookingInfo) {
                bookingInfo.innerHTML = `
                    <div class="booking-details-grid">
                        <div class="detail-item">
                            <h6><i class="fas fa-route"></i>Route</h6>
                            <p class="mb-0">${data.booking.route.from} → ${data.booking.route.to}</p>
                        </div>
                        <div class="detail-item">
                            <h6><i class="fas fa-calendar"></i>Travel Date</h6>
                            <p class="mb-0">${new Date(data.booking.travelDate).toLocaleDateString()}</p>
                        </div>
                        <div class="detail-item">
                            <h6><i class="fas fa-clock"></i>Departure Time</h6>
                            <p class="mb-0">${data.booking.departureTime}</p>
                        </div>
                        <div class="detail-item">
                            <h6><i class="fas fa-user"></i>Passenger</h6>
                            <p class="mb-0">${data.booking.passengerName}</p>
                        </div>
                        <div class="detail-item seats-detail">
                            <h6><i class="fas fa-chair"></i>Selected Seats</h6>
                            ${formatSeats(data.booking.seats)}
                        </div>
                        <div class="detail-item">
                            <h6><i class="fas fa-money-bill"></i>Total Amount</h6>
                            <p class="mb-0">KES ${data.booking.totalAmount.toLocaleString()}</p>
                        </div>
                        <div class="detail-item">
                            <h6><i class="fas fa-calendar-check"></i>Booking Date</h6>
                            <p class="mb-0">${new Date(data.booking.bookingDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                `;
            }

            bookingDetails.style.display = 'block';
            utils.showToast('Success', 'Ticket verified successfully!', 'success');
            
        } catch (error) {
            utils.showToast('Error', error.message, 'error');
            bookingDetails.style.display = 'none';
        } finally {
            utils.hideLoading();
        }
    });
}); 