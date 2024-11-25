// Store DOM references
const elements = {
  seatMap: document.getElementById("seatMap"),
  bookingForm: document.getElementById("bookingForm"),
  selectedSeatsDisplay: document.getElementById("selectedSeatsDisplay"),
  selectedSeatsInput: document.getElementById("selectedSeatsInput"),
  departureTimeSelect: document.getElementById("departureTime"),
  travelDateInput: document.getElementById("travelDate"),
  totalAmountInput: document.getElementById("totalAmountInput"),
  priceBreakdown: {
    vipCount: document.getElementById("vipCount"),
    regularCount: document.getElementById("regularCount"),
    vipTotal: document.getElementById("vipTotal"),
    regularTotal: document.getElementById("regularTotal"),
    totalPrice: document.getElementById("totalPrice"),
  },
};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  if (elements.seatMap) {
    // Wait for a brief moment to ensure all data is loaded
    setTimeout(() => {
      createSeatMap();
      updateSeatAvailability();
    }, 100);

    dateTimeHandler.init();
    setupFormValidation();
    setupEventListeners();
  }
});

// Setup event listeners
function setupEventListeners() {
  // Date and time change handlers
  elements.travelDateInput?.addEventListener("change", updateSeatAvailability);
  elements.departureTimeSelect?.addEventListener(
    "change",
    updateSeatAvailability
  );

  // Return journey handler
  document
    .getElementById("returnJourney")
    ?.addEventListener("change", handleReturnJourney);
}

// Helper function to determine seat position
function getSeatPosition(seatInRow, seatsPerRow) {
  if (seatInRow === 1 || seatInRow === seatsPerRow) {
    return "Window";
  }
  if (seatInRow === 2 || seatInRow === 3) {
    return "Aisle";
  }
  return "";
}

// Helper function to get seat properties
function getSeatProperties(row, seatInRow, seatsPerRow, vipRows) {
  const seatNumber = String((row - 1) * seatsPerRow + seatInRow);
  const isVip = vipRows.includes(row);
  const position = getSeatPosition(seatInRow, seatsPerRow);

  return { seatNumber, isVip, position };
}

// Create the seat map
function createSeatMap() {
  if (!elements.seatMap) return;

  const { totalRows, seatsPerRow, vipRows } = routeData.seatLayout;
  elements.seatMap.innerHTML = ""; // Clear existing seats

  // Get current date-time key
  const dateTimeKey = `${elements.travelDateInput.value}_${elements.departureTimeSelect.value}`;
  const bookedSeats = routeData.bookedSeats[dateTimeKey] || [];

  // Create seats for each row
  for (let row = 1; row <= totalRows; row++) {
    createSeatsForRow(row, seatsPerRow, vipRows, bookedSeats);
  }
}

// Helper function to create seats for a single row
function createSeatsForRow(row, seatsPerRow, vipRows, bookedSeats) {
  for (let seatInRow = 1; seatInRow <= seatsPerRow; seatInRow++) {
    const { seatNumber, isVip, position } = getSeatProperties(
      row,
      seatInRow,
      seatsPerRow,
      vipRows
    );
    const isBooked = bookedSeats.includes(seatNumber);

    const seat = createSeatElement(
      seatNumber,
      isVip ? "vip" : "regular",
      position,
      isBooked
    );

    elements.seatMap.appendChild(seat);
  }
}

// Create individual seat element
function createSeatElement(seatNumber, seatType, position, isBooked) {
  const seat = document.createElement("div");
  seat.className = `seat ${seatType}`;

  // Add booked class if the seat is booked
  if (isBooked) {
    seat.classList.add("booked");
  }

  seat.dataset.seatNumber = seatNumber;
  seat.dataset.seatType = seatType;
  seat.dataset.position = position || "";

  // Simplified inner structure - just the seat number
  seat.innerHTML = `<span class="seat-number">${seatNumber}</span>`;

  // Only add click event listener if seat is not booked
  if (!isBooked) {
    seat.addEventListener("click", handleSeatClick);
  }

  return seat;
}

// Submit booking
async function submitBooking(form) {
  const selectedSeats = Array.from(document.querySelectorAll(".seat.selected"))
    .filter((seat) => seat.dataset.seatNumber && seat.dataset.seatType) // Filter out invalid seats
    .map((seat) => ({
      number: String(seat.dataset.seatNumber),
      type: seat.dataset.seatType,
      position: seat.dataset.position || "",
    }));

  console.log("Final Selected Seats:", selectedSeats);

  if (selectedSeats.length === 0) {
    throw new Error("Please select at least one seat");
  }

  const formData = new FormData(form);
  const requestBody = {
    routeId: routeData.id,
    selectedSeats: selectedSeats,
    departureTime: elements.departureTimeSelect.value,
    travelDate: elements.travelDateInput.value,
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  };

  console.log("Request Body:", requestBody);

  try {
    const response = await fetch("/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log("Response Data:", responseData);

    if (!response.ok) {
      throw new Error(responseData.error || "Booking failed");
    }

    if (responseData.html) {
      document.body.innerHTML = responseData.html;
      utils.showToast("Success", "Booking confirmed successfully!", "success");
    }

    return responseData;
  } catch (error) {
    console.error("Error:", error);
    throw new Error(error.message || "Booking failed. Please try again.");
  }
}

// Update selected seats information
function updateSelectedSeats() {
  const selectedSeats = Array.from(document.querySelectorAll('.seat.selected'))
    .filter((seat) => seat.dataset.seatNumber && seat.dataset.seatType)
    .map((seat) => ({
      number: String(seat.dataset.seatNumber),
      type: seat.dataset.seatType,
      position: seat.dataset.position || "",
    }));

  // Double-check the limit here too
  if (selectedSeats.length > 5) {  // Hardcode to 5 for guaranteed limit
    utils.showToast('Error', 'Maximum 5 seats allowed per booking', 'error');
    // Remove the last selected seat
    const lastSelected = document.querySelector('.seat.selected:last-child');
    if (lastSelected) {
      lastSelected.classList.remove('selected');
    }
    return;
  }

  // Update the UI with valid selection
  if (elements.selectedSeatsInput) {
    elements.selectedSeatsInput.value = JSON.stringify(selectedSeats);
  }

  if (elements.selectedSeatsDisplay) {
    if (selectedSeats.length > 0) {
      const seatsList = selectedSeats
        .map((seat) => {
          const seatType = seat.type.charAt(0).toUpperCase() + seat.type.slice(1);
          const positionInfo = seat.position ? ` (${seat.position})` : "";
          return `
            <div class="selected-seat-item">
              <div class="d-flex align-items-center gap-3">
                <span class="seat-number">Seat ${seat.number}</span>
                <span class="seat-type ${seat.type.toLowerCase()}">${seatType}${positionInfo}</span>
              </div>
              <button type="button" class="remove-seat" 
                      data-seat-number="${seat.number}" 
                      aria-label="Remove seat">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          `;
        })
        .join("");

      elements.selectedSeatsDisplay.innerHTML = `
        <div class="selected-seats-container">
          <h6>
            <i class="fas fa-chair me-2"></i>
            Selected Seats (${selectedSeats.length}/${routeData.rules.maxSeatsPerBooking})
          </h6>
          <div class="selected-seats-list">
            ${seatsList}
          </div>
        </div>
      `;
    } else {
      elements.selectedSeatsDisplay.innerHTML = `
        <div class="selected-seats-container">
          <p class="text-muted mb-0">
            <i class="fas fa-info-circle me-2"></i>
            No seats selected
          </p>
        </div>
      `;
    }
  }

  createPassengerDetailsForm(selectedSeats.length);
}

// Handle seat click
function handleSeatClick(event) {
  const seat = event.currentTarget;
  
  // Don't allow selection of booked seats
  if (seat.classList.contains('booked')) {
    return;
  }

  // If the seat is already selected, always allow deselection
  if (seat.classList.contains('selected')) {
    seat.classList.remove('selected');
    updateSelectedSeats();
    updatePriceCalculation();
    updateBookingFormVisibility();
    return;
  }

  // Check current selection count BEFORE adding new seat
  const currentSelectedCount = document.querySelectorAll('.seat.selected').length;

  console.log("Current Selected Count:", currentSelectedCount);
  
  // Hard stop if we're at max seats
  if (currentSelectedCount > 5) {  // Hardcode to 5 for guaranteed limit
    utils.showToast('Maximum Seats', 'You can only select up to 5 seats per booking', 'error');
    return;
  }

  // If we get here, we can select the new seat
  seat.classList.add('selected');
  updateSelectedSeats();
  updatePriceCalculation();
  updateBookingFormVisibility();
}

// Update price calculation
function updatePriceCalculation() {
  const selectedSeats = document.querySelectorAll(".seat.selected");
  const vipPrice = routeData.seatLayout.prices.vip;
  const regularPrice = routeData.seatLayout.prices.regular;

  let vipCount = 0;
  let regularCount = 0;

  // Count selected seats by type
  selectedSeats.forEach((seat) => {
    if (seat.classList.contains("vip")) {
      vipCount++;
    } else if (seat.classList.contains("regular")) {
      regularCount++;
    }
  });

  // Calculate totals
  const vipTotal = vipCount * vipPrice;
  const regularTotal = regularCount * regularPrice;

  // Update display
  if (elements.priceBreakdown) {
    elements.priceBreakdown.vipCount.textContent = vipCount;
    elements.priceBreakdown.regularCount.textContent = regularCount;
    elements.priceBreakdown.vipTotal.textContent = vipTotal.toLocaleString();
    elements.priceBreakdown.regularTotal.textContent =
      regularTotal.toLocaleString();
    elements.priceBreakdown.totalPrice.textContent = (
      vipTotal + regularTotal
    ).toLocaleString();
  }

  if (elements.totalAmountInput) {
    elements.totalAmountInput.value = vipTotal + regularTotal;
  }
}

// Update seat availability based on selected date and time
async function updateSeatAvailability() {
  const dateTimeKey = `${elements.travelDateInput.value}_${elements.departureTimeSelect.value}`;

  try {
    const response = await fetch("/api/check-seats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId: routeData.id,
        dateTimeKey: dateTimeKey,
      }),
    });

    const data = await response.json();
    if (data.success) {
      // Update routeData with the latest booked seats
      routeData.bookedSeats[dateTimeKey] = data.bookedSeats;
      createSeatMap(); // Recreate the seat map with updated data
    }
  } catch (error) {
    console.error("Error checking seat availability:", error);
  }
}

// Create passenger details form
function createPassengerDetailsForm(seatCount) {
  const container = document.getElementById("passengerDetails");
  if (!container) return;

  container.innerHTML = Array(seatCount)
    .fill(null)
    .map(
      (_, i) => `
        <div class="passenger-details mb-3">
            <h6>Passenger ${i + 1}</h6>
            <div class="row">
                <div class="col-md-6">
                    <input type="text" class="form-control" 
                           name="passengers[${i}][name]" 
                           required placeholder="Passenger Name">
                </div>
                <div class="col-md-6">
                    <select class="form-select" name="passengers[${i}][type]" required>
                        <option value="adult">Adult</option>
                        <option value="child">Child (Under 12)</option>
                    </select>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Setup form validation
function setupFormValidation() {
  const form = document.getElementById("reservationForm");
  if (!form) return;

  // Add validation to required inputs
  form.querySelectorAll("input[required]").forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.toggle("is-valid", this.value.trim() !== "");
      this.classList.toggle("is-invalid", this.value.trim() === "");
    });
  });

  // Handle form submission
  form.addEventListener("submit", handleFormSubmission);
}

// Handle form submission
async function handleFormSubmission(e) {
  e.preventDefault();

  if (!utils.validateForm(this)) {
    utils.showToast("Error", "Please fill in all required fields", "error");
    return;
  }

  utils.showLoading();
  try {
    const response = await submitBooking(this);
    handleBookingResponse(response);
  } catch (error) {
    utils.showToast("Error", error.message, "error");
  } finally {
    utils.hideLoading();
  }
}

// Handle return journey checkbox
function handleReturnJourney() {
  const returnDetails = document.getElementById("returnJourneyDetails");
  if (!returnDetails) return;

  returnDetails.style.display = this.checked ? "block" : "none";

  if (this.checked) {
    const minReturnDate = new Date();
    minReturnDate.setDate(minReturnDate.getDate() + 1);
    document.getElementById("returnDate").min = minReturnDate
      .toISOString()
      .split("T")[0];
  }

  updatePriceCalculation();
}

// Handle booking response
function handleBookingResponse(response) {
  if (response.html) {
    document.body.innerHTML = response.html;
  }
  utils.showToast("Success", "Booking confirmed successfully!", "success");
}

// Update booking form visibility
function updateBookingFormVisibility() {
  if (elements.bookingForm) {
    const hasSelectedSeats =
      document.querySelectorAll(".seat.selected").length > 0;
    elements.bookingForm.style.display = hasSelectedSeats ? "block" : "none";
  }
}

document.getElementById('reservationForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form inputs
    const form = this;
    const nameInput = form.querySelector('[name="fullName"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const emailInput = form.querySelector('[name="email"]');
    const routeIdInput = form.querySelector('[name="routeId"]');
    const selectedSeatsInput = form.querySelector('[name="selectedSeats"]');
    const departureTimeInput = document.getElementById('departureTime');
    const travelDateInput = document.getElementById('travelDate');

    // Validate all required fields
    let isValid = utils.validateForm(form);

    // Additional validation
    if (isValid) {
        if (!validation.validate.name(nameInput.value)) {
            utils.showToast('Error', validation.errors.name, 'error');
            isValid = false;
        }
        if (!validation.validate.phone(phoneInput.value)) {
            utils.showToast('Error', validation.errors.phone, 'error');
            isValid = false;
        }
        if (!validation.validate.email(emailInput.value)) {
            utils.showToast('Error', validation.errors.email, 'error');
            isValid = false;
        }
    }

    if (!isValid) {
        return false;
    }

    // Prepare booking data
    const bookingData = {
        routeId: routeIdInput.value,
        selectedSeats: JSON.parse(selectedSeatsInput.value),
        departureTime: departureTimeInput.value,
        travelDate: travelDateInput.value,
        fullName: validation.sanitize.string(nameInput.value.trim()),
        phone: validation.sanitize.phone(phoneInput.value.trim()),
        email: validation.sanitize.email(emailInput.value.trim())
    };

    utils.showLoading();
    
    try {
        const response = await fetch('/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Booking failed');
        }

        // Show success message
        utils.showToast('Success', 'Booking confirmed!', 'success');
        
        // Wait for toast to be visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to confirmation page
        if (data.booking?.id) {
            window.location.href = `/booking-confirmation/${data.booking.id}`;
        } else {
            throw new Error('Invalid booking response');
        }

    } catch (error) {
        utils.showToast('Error', error.message, 'error');
    } finally {
        utils.hideLoading();
    }
});