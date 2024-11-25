const bookingManagement = {
    init: function() {
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        document.getElementById('viewTicketForm')?.addEventListener('submit', this.handleViewTicket.bind(this));
        document.getElementById('cancelBookingForm')?.addEventListener('submit', this.handleCancelBooking.bind(this));
        document.getElementById('printTicket')?.addEventListener('click', this.handlePrintTicket.bind(this));
    },

    async handleViewTicket(e) {
        e.preventDefault();
        const bookingRef = document.getElementById('bookingRef').value;
        const phone = document.getElementById('phone').value;

        if (!this.validateInputs(bookingRef, phone)) return;

        utils.showLoading();
        try {
            const response = await this.fetchBookingDetails(bookingRef, phone);
            this.displayTicket(response.booking);
            new bootstrap.Modal(document.getElementById('ticketModal')).show();
        } catch (error) {
            utils.showToast('Error', error.message, 'error');
        } finally {
            utils.hideLoading();
        }
    },

    async handleCancelBooking(e) {
        e.preventDefault();
        const bookingRef = document.getElementById('cancelBookingRef').value;
        const phone = document.getElementById('cancelPhone').value;

        if (!this.validateInputs(bookingRef, phone)) return;

        if (!confirm('Are you sure you want to cancel this booking?')) return;

        utils.showLoading();
        try {
            const response = await fetch('/api/cancel-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingReference: bookingRef, phone })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            utils.showToast('Success', 'Booking cancelled successfully', 'success');
            document.getElementById('cancelBookingForm').reset();
        } catch (error) {
            utils.showToast('Error', error.message, 'error');
        } finally {
            utils.hideLoading();
        }
    },

    handlePrintTicket() {
        const ticketContent = document.getElementById('ticketContent').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bus Ticket</title>
                    <link href="/css/styles.css" rel="stylesheet">
                    <style>
                        body { padding: 20px; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${ticketContent}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
    },

    validateInputs(bookingRef, phone) {
        if (!validation.validate.bookingReference(bookingRef)) {
            utils.showToast('Error', validation.errors.bookingReference, 'error');
            return false;
        }
        if (!validation.validate.phone(phone)) {
            utils.showToast('Error', validation.errors.phone, 'error');
            return false;
        }
        return true;
    },

    async fetchBookingDetails(bookingRef, phone) {
        const response = await fetch('/api/verify-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingReference: bookingRef,
                phone
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    displayTicket(booking) {
        const ticketContent = document.getElementById('ticketContent');
        ticketContent.innerHTML = `
            <div class="ticket-container">
                <div class="ticket-header">
                    <h4>Kenya Bus Booking</h4>
                    <p class="booking-ref">Ref: ${booking.reference}</p>
                </div>
                <div class="ticket-details">
                    <div class="row">
                        <div class="col-6">
                            <p><strong>Route:</strong><br>${booking.route.from} to ${booking.route.to}</p>
                            <p><strong>Date:</strong><br>${booking.travelDate}</p>
                            <p><strong>Time:</strong><br>${booking.departureTime}</p>
                        </div>
                        <div class="col-6">
                            <p><strong>Passenger:</strong><br>${booking.passengerName}</p>
                            <p><strong>Seats:</strong><br>${booking.seats.map(s => `${s.number} (${s.type})`).join(', ')}</p>
                            <p><strong>Amount:</strong><br>Pay on boarding</p>
                        </div>
                    </div>
                </div>
                <div class="ticket-footer">
                    <p class="text-muted">Please arrive 30 minutes before departure. Payment in cash only.</p>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => bookingManagement.init()); 