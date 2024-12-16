// Single declaration of elements at the top level
const elements = {
  travelDateInput: null,
  departureTimeSelect: null,
  seatMap: null,
  selectedSeatsDisplay: null,
  totalAmountDisplay: null,
  vipCountDisplay: null,
  vipTotalDisplay: null,
  regularCountDisplay: null,
  regularTotalDisplay: null,
  totalPriceDisplay: null,
  passengerDetailsModal: null,
  bookingConfirmationModal: null,
  continueButton: null,
  confirmDetailsButton: null,
  backToDetailsButton: null,
  passengerForm: null,
  confirmBookingButton: null,
};

// Initialize all elements
function initializeElements() {
  elements.travelDateInput = document.getElementById("travelDate");
  elements.departureTimeSelect = document.getElementById("departureTime");
  elements.seatMap = document.getElementById("seatMap");
  elements.selectedSeatsDisplay = document.getElementById(
    "selectedSeatsDisplay"
  );
  elements.vipCountDisplay = document.getElementById("vipCount");
  elements.vipTotalDisplay = document.getElementById("vipTotal");
  elements.regularCountDisplay = document.getElementById("regularCount");
  elements.regularTotalDisplay = document.getElementById("regularTotal");
  elements.totalPriceDisplay = document.getElementById("totalPrice");
  elements.continueButton = document.getElementById("continueToDetails");
  elements.confirmDetailsButton = document.getElementById("confirmDetails");
  elements.backToDetailsButton = document.getElementById("backToDetails");
  elements.passengerForm = document.getElementById("passengerDetailsForm");
  elements.confirmBookingButton = document.getElementById("confirmBooking");

  // Safely initialize modals
  const passengerDetailsModalEl = document.getElementById(
    "passengerDetailsModal"
  );
  const bookingConfirmationModalEl = document.getElementById(
    "bookingConfirmationModal"
  );

  if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
    if (passengerDetailsModalEl) {
      elements.passengerDetailsModal = new bootstrap.Modal(
        passengerDetailsModalEl,
        {
          backdrop: "static",
          keyboard: false,
        }
      );
    }

    if (bookingConfirmationModalEl) {
      elements.bookingConfirmationModal = new bootstrap.Modal(
        bookingConfirmationModalEl,
        {
          backdrop: "static",
          keyboard: false,
        }
      );
    }
  }

  console.log("Elements initialized:", {
    seatMap: !!elements.seatMap,
    travelDate: !!elements.travelDateInput,
    departureTime: !!elements.departureTimeSelect,
    priceDisplays: {
      vipCount: !!elements.vipCountDisplay,
      vipTotal: !!elements.vipTotalDisplay,
      regularCount: !!elements.regularCountDisplay,
      regularTotal: !!elements.regularTotalDisplay,
      totalPrice: !!elements.totalPriceDisplay,
    },
    modals: {
      passengerDetails: !!elements.passengerDetailsModal,
      bookingConfirmation: !!elements.bookingConfirmationModal,
    },
  });

  // Setup form handlers
  setupFormHandlers();
}

// Main initialization on DOM load
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing...");
  initializeElements();

  // Only proceed with seat map initialization if it exists
  if (document.getElementById("seatMap")) {
    console.log("Seat map element found");
    setupEventListeners();
    setDefaultDate();
  }
});

// Event Listeners Setup
function setupEventListeners() {
  // Date change handler
  elements.travelDateInput?.addEventListener("change", () => {
    console.log("Date changed:", elements.travelDateInput.value);
    checkAndUpdateAvailableTimes();
  });

  // Time change handler
  elements.departureTimeSelect?.addEventListener("change", () => {
    console.log("Time changed:", elements.departureTimeSelect.value);
    updateSeatAvailability();
  });

  // Button handlers
  elements.continueButton?.addEventListener("click", handleContinueToDetails);
  elements.confirmDetailsButton?.addEventListener(
    "click",
    handleConfirmDetails
  );
  elements.backToDetailsButton?.addEventListener("click", handleBackToDetails);
  elements.confirmBookingButton?.addEventListener(
    "click",
    handleConfirmBooking
  );

  // Modal handlers
  if (elements.passengerDetailsModal?._element) {
    elements.passengerDetailsModal._element.addEventListener(
      "hidden.bs.modal",
      (event) => {
        if (!event.target._programmaticClose) {
          handleModalClose(event);
        }
      }
    );
  }

  if (elements.bookingConfirmationModal?._element) {
    elements.bookingConfirmationModal._element.addEventListener(
      "hidden.bs.modal",
      (event) => {
        if (!event.target._programmaticClose) {
          handleConfirmationModalClose(event);
        }
      }
    );
  }

  // Update the back button handler
  const backButton = document.getElementById("backToDetails");
  if (backButton) {
    backButton.onclick = handleBackToDetails;
  }
}

// Seat Map Creation and Management
function createSeatMap() {
  if (!elements.seatMap || !routeData.seatLayout) {
    console.warn("Cannot create seat map: missing required elements");
    return;
  }

  const { totalRows, seatsPerRow, vipRows = [] } = routeData.seatLayout;
  console.log("Creating seat map with:", { totalRows, seatsPerRow, vipRows });

  let seatMapHTML = '<div class="seat-map-grid">';

  for (let row = 1; row <= totalRows; row++) {
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatNumber = ((row - 1) * seatsPerRow + seat).toString();
      const isVIP = vipRows.includes(row);
      const seatType = isVIP ? "vip" : "regular";

      console.log(`Creating seat ${seatNumber}:`, {
        row,
        seat,
        isVIP,
        seatType,
      });

      seatMapHTML += `
              <div class="seat ${seatType}" 
                   data-seat-number="${seatNumber}"
                   data-seat-type="${seatType}"
                   data-row="${row}"
                   data-position="${getPosition(seat, seatsPerRow)}"
                   data-is-vip="${isVIP}"
                   title="Seat ${seatNumber} (${seatType.toUpperCase()})">
                  ${seatNumber}
              </div>`;
    }
  }
  seatMapHTML += "</div>";

  // Add the legend
  seatMapHTML += createSeatLegend();

  elements.seatMap.innerHTML = seatMapHTML;
  attachSeatHandlers();
}

function createSeatLegend() {
  return `
        <div class="seat-legend">
            <div class="legend-item">
                <div class="seat-demo regular"></div>
                <span class="legend-text">Regular</span>
            </div>
            <div class="legend-item">
                <div class="seat-demo vip"></div>
                <span class="legend-text">VIP</span>
            </div>
            <div class="legend-item">
                <div class="seat-demo selected"></div>
                <span class="legend-text">Selected</span>
            </div>
            <div class="legend-item">
                <div class="seat-demo booked"></div>
                <span class="legend-text">Booked</span>
            </div>
        </div>`;
}

function attachSeatHandlers() {
  document.querySelectorAll(".seat").forEach((seat) => {
    console.log("Attaching handler to seat:", {
      number: seat.getAttribute("data-seat-number"),
      type: seat.getAttribute("data-seat-type"),
      row: seat.getAttribute("data-row"),
      isVIP: seat.getAttribute("data-is-vip"),
    });

    seat.addEventListener("click", handleSeatClick);
  });
}

function handleSeatClick(event) {
  const seat = event.currentTarget;
  const seatData = {
    number: seat.getAttribute("data-seat-number"),
    type: seat.getAttribute("data-seat-type"),
    row: seat.getAttribute("data-row"),
    isVIP: seat.getAttribute("data-is-vip"),
  };

  console.log("Clicked seat:", seatData);

  // Validate seat data
  if (!seatData.number || !seatData.type) {
    console.error("Invalid seat data:", seatData);
    return;
  }

  if (!seat.classList.contains("booked")) {
    // Check if seat is already selected
    if (seat.classList.contains("selected")) {
      seat.classList.remove("selected");
    } else {
      // Check max seats before adding new selection
      const selectedSeats = getSelectedSeats();
      const maxSeats = routeData.rules?.maxSeatsPerBooking || 5;

      if (selectedSeats.length >= maxSeats) {
        utils.showToast(
          "Error",
          `Maximum ${maxSeats} seats allowed per booking`,
          "error"
        );
        return;
      }
      seat.classList.add("selected");
    }

    // Update displays with price information
    updateSelectedSeatsDisplay();
    updateContinueButton();
  }
}

function getPosition(seatInRow, seatsPerRow) {
  if (seatInRow === 1) return "Window";
  if (seatInRow === seatsPerRow) return "Window";
  return "Aisle";
}

function getSelectedSeats() {
  // Only get seats that have valid data attributes
  return document.querySelectorAll(
    ".seat.selected[data-seat-number][data-seat-type]"
  );
}

function updateContinueButton() {
  if (elements.continueButton) {
    elements.continueButton.disabled = getSelectedSeats().length === 0;
  }
}

// Seat Selection Display and Updates
function updateSelectedSeatsDisplay() {
  if (!elements.selectedSeatsDisplay) {
    console.warn("Selected seats display element not found");
    return;
  }

  const selectedSeats = Array.from(getSelectedSeats());

  if (selectedSeats.length === 0) {
    elements.selectedSeatsDisplay.innerHTML = `
            <div class="empty-seats-message">
                <i class="fas fa-info-circle"></i>
                <div class="message-content">
                    <p>No seats selected</p>
                    <small>Click on available seats to select them</small>
                </div>
            </div>
        `;
    updateTotalAmount(selectedSeats);
    return;
  }

  const seatsHTML = selectedSeats
    .map((seat) => {
      const seatNumber = seat.getAttribute("data-seat-number");
      const isVIP = seat.getAttribute("data-is-vip") === "true";
      const position = seat.getAttribute("data-position");
      const price = isVIP
        ? routeData.seatLayout.prices.vip
        : routeData.seatLayout.prices.regular;

      return `
            <div class="selected-seat-item ${isVIP ? "vip" : "regular"}">
                <div class="seat-number">
                    <i class="fas fa-chair"></i>
                    <span>Seat ${seatNumber}</span>
                </div>
                <div class="seat-details">
                    <span class="seat-type-badge">
                        ${isVIP ? "VIP" : "Regular"}
                    </span>
                    <span class="seat-position">${position}</span>
                    <span class="seat-price">KES ${price.toLocaleString()}</span>
                </div>
            </div>
        `;
    })
    .join("");

  elements.selectedSeatsDisplay.innerHTML = `
        <div class="selected-seats-grid">
            ${seatsHTML}
        </div>
        <div class="price-breakdown mt-3">
            <div class="breakdown-item">
                <span>VIP Seats <span class="seat-count">${
                  selectedSeats.filter(
                    (s) => s.getAttribute("data-is-vip") === "true"
                  ).length
                }</span></span>
                <span>KES ${elements.vipTotalDisplay?.textContent || "0"}</span>
            </div>
            <div class="breakdown-item">
                <span>Regular Seats <span class="seat-count">${
                  selectedSeats.filter(
                    (s) => s.getAttribute("data-is-vip") === "false"
                  ).length
                }</span></span>
                <span>KES ${
                  elements.regularTotalDisplay?.textContent || "0"
                }</span>
            </div>
            <div class="breakdown-item total">
                <span>Total Amount</span>
                <span>KES ${
                  elements.totalPriceDisplay?.textContent || "0"
                }</span>
            </div>
        </div>
    `;

  updateTotalAmount(selectedSeats);
}

function updateTotalAmount(selectedSeats) {
  // Count VIP and regular seats
  const vipSeats = selectedSeats.filter(
    (seat) => seat.getAttribute("data-is-vip") === "true"
  );
  const regularSeats = selectedSeats.filter(
    (seat) => seat.getAttribute("data-is-vip") === "false"
  );

  // Update counts with null checks
  if (elements.vipCountDisplay) {
    elements.vipCountDisplay.textContent = vipSeats.length;
  }
  if (elements.regularCountDisplay) {
    elements.regularCountDisplay.textContent = regularSeats.length;
  }

  // Calculate totals
  const vipTotal = vipSeats.length * routeData.seatLayout.prices.vip;
  const regularTotal =
    regularSeats.length * routeData.seatLayout.prices.regular;
  const totalAmount = vipTotal + regularTotal;

  // Update price displays with null checks
  if (elements.vipTotalDisplay) {
    elements.vipTotalDisplay.textContent = vipTotal.toLocaleString();
  }
  if (elements.regularTotalDisplay) {
    elements.regularTotalDisplay.textContent = regularTotal.toLocaleString();
  }
  if (elements.totalPriceDisplay) {
    elements.totalPriceDisplay.textContent = totalAmount.toLocaleString();
  }

  console.log("Price breakdown:", {
    vipSeats: vipSeats.length,
    regularSeats: regularSeats.length,
    vipTotal,
    regularTotal,
    totalAmount,
  });
}

// Also update the updateSeatDisplay function to include null checks
function updateSeatDisplay(bookedSeats = []) {
  if (!elements.seatMap) {
    console.warn("Seat map not found");
    return;
  }

  const seats = document.querySelectorAll(".seat");
  seats.forEach((seat) => {
    const seatNumber = seat.getAttribute("data-seat-number");
    if (bookedSeats.includes(seatNumber)) {
      seat.classList.add("booked");
      seat.classList.remove("selected");
    } else {
      seat.classList.remove("booked");
    }
  });

  // Update selected seats display as booked seats might have been deselected
  updateSelectedSeatsDisplay();
}

// Seat Availability Updates
async function updateSeatAvailability() {
  try {
    const date = elements.travelDateInput.value;
    const time = elements.departureTimeSelect.value;

    if (!date || !time) {
      console.warn("Date or time not selected");
      return;
    }

    const dateTimeKey = `${date}_${time}`;
    console.log("Checking availability for:", dateTimeKey);

    // Reset all selected seats first
    resetSelectedSeats();

    const response = await fetch(
      `/api/check-seats/${routeData.id}/${dateTimeKey}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      updateSeatDisplay(data.bookedSeats);
    } else {
      throw new Error(data.error || "Failed to get seat availability");
    }
  } catch (error) {
    console.error("Error updating seat availability:", error);
    utils.showToast("Error", "Failed to update seat availability", "error");
  }
}

// Add a new function to reset selected seats
function resetSelectedSeats() {
  // Remove selected class from all seats
  document.querySelectorAll(".seat.selected").forEach((seat) => {
    seat.classList.remove("selected");
  });

  // Reset the selected seats display
  updateSelectedSeatsDisplay();

  // Reset the continue button state
  updateContinueButton();
}

// Booking Process Handlers
function handleContinueToDetails() {
  const selectedSeats = getSelectedSeats();
  if (selectedSeats.length === 0) {
    utils.showToast("Error", "Please select at least one seat", "error");
    return;
  }

  // Update the hidden input with selected seats
  const selectedSeatsInput = document.getElementById("selectedSeatsInput");
  if (selectedSeatsInput) {
    const seatsData = Array.from(selectedSeats).map((seat) => ({
      number: seat.getAttribute("data-seat-number"),
      type: seat.getAttribute("data-seat-type"),
      isVIP: seat.getAttribute("data-is-vip") === "true",
    }));

    // Debug log
    console.log("Selected Seats Data:", seatsData);

    selectedSeatsInput.value = JSON.stringify(seatsData);
  }

  elements.passengerDetailsModal?.show();
}

function handleConfirmDetails(event) {
  event.preventDefault();

  if (!elements.passengerForm) {
    console.error("Passenger form not found");
    return;
  }

  if (!utils.validateForm(elements.passengerForm)) {
    utils.showToast("Error", "Please fill in all required fields", "error");
    return;
  }

  const formData = new FormData(elements.passengerForm);
  const selectedSeats = Array.from(getSelectedSeats()).map((seat) => ({
    number: seat.getAttribute("data-seat-number"),
    type: seat.getAttribute("data-seat-type"),
    isVIP: seat.getAttribute("data-is-vip") === "true",
  }));

  const bookingData = {
    routeId: routeData.id,
    travelDate: elements.travelDateInput.value,
    departureTime: elements.departureTimeSelect.value,
    seats: selectedSeats,
    passengerDetails: Object.fromEntries(formData),
  };

  submitBooking(bookingData);
}

async function submitBooking(bookingData) {
  try {
    utils.showLoading();

    console.log("Submitting booking data:", bookingData);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server response:", data);
      throw new Error(data.error || "Booking failed");
    }

    // Hide the confirmation modal
    elements.bookingConfirmationModal?.hide();

    // Redirect to the booking confirmation page
    window.location.href = `/booking-confirmation/${data.booking.id}`;
  } catch (error) {
    console.error("Booking error:", error);
    utils.showToast(
      "Error",
      error.message || "Failed to complete booking",
      "error"
    );
  } finally {
    utils.hideLoading();
  }
}

// Modal Handlers
function handleModalClose(event) {
  // If we're handling a programmatic close (not user clicking X or backdrop), don't reset
  if (event && event.target._programmaticClose) {
    return;
  }

  // Only reset the form if it's a user-initiated close
  if (elements.passengerForm) {
    elements.passengerForm.reset();
  }
}

function handleConfirmationModalClose(event) {
  // If we're handling a programmatic close (not user clicking X or backdrop), do nothing
  if (event && event.target._programmaticClose) {
    return;
  }

  // Just close the modal, no reload needed
  elements.bookingConfirmationModal?.hide();
}

function showBookingConfirmation(bookingData) {
  // Implementation depends on your UI requirements
  elements.bookingConfirmationModal?.show();
}

// Add form submission handler
function setupFormHandlers() {
  const reservationForm = document.getElementById("reservationForm");
  if (reservationForm) {
    reservationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!reservationForm.checkValidity()) {
        reservationForm.classList.add("was-validated");
        return;
      }

      const formData = new FormData(reservationForm);
      const bookingData = {
        routeId: routeData.id,
        travelDate: elements.travelDateInput.value,
        departureTime: elements.departureTimeSelect.value,
        seats: JSON.parse(document.getElementById("selectedSeatsInput").value),
        passengerDetails: {
          fullName: formData.get("fullName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
        },
      };

      showBookingConfirmationModal(bookingData);
    });
  }
}

// Add function to show booking confirmation modal
function showBookingConfirmationModal(bookingData) {
  elements.passengerDetailsModal?.hide();

  const modalDialog = document.querySelector(
    "#bookingConfirmationModal .modal-dialog"
  );
  if (modalDialog) {
    modalDialog.classList.add("modal-lg");
  }

  const modalBody = document.querySelector(
    "#bookingConfirmationModal .modal-body"
  );
  if (modalBody) {
    // Create a better formatted seats display with grid layout
    const seatsDisplay = bookingData.seats
      .map(
        (seat) => `
            <div class="selected-seat-tag ${seat.isVIP ? "vip" : "regular"}">
                <div class="seat-info">
                    <i class="fas fa-chair"></i>
                    <span>Seat ${seat.number}</span>
                </div>
                <span class="seat-type-badge">
                    ${seat.isVIP ? "VIP" : "Regular"}
                </span>
            </div>
        `
      )
      .join("");

    modalBody.innerHTML = `
            <div class="booking-summary">
                <h4 class="mb-4"><i class="fas fa-ticket-alt me-2"></i>Booking Summary</h4>
                <div class="summary-grid">
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="summary-item">
                                <h6><i class="fas fa-route"></i>Route</h6>
                                <p>${routeData.from} → ${routeData.to}</p>
                                <small class="text-muted">Express Service</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="summary-item">
                                <h6><i class="fas fa-calendar"></i>Travel Date</h6>
                                <p>${new Date(
                                  bookingData.travelDate
                                ).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}</p>
                                <small class="text-muted">${
                                  bookingData.departureTime
                                }</small>
                            </div>
                        </div>
                    </div>

                    <div class="row g-4 mt-2">
                        <div class="col-md-6">
                            <div class="summary-item">
                                <h6><i class="fas fa-user"></i>Passenger Details</h6>
                                <p>${bookingData.passengerDetails.fullName}</p>
                                <small class="text-muted">${
                                  bookingData.passengerDetails.phone
                                }</small>
                                <small class="text-muted d-block">${
                                  bookingData.passengerDetails.email
                                }</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="summary-item seats-summary">
                                <h6><i class="fas fa-chair"></i>Selected Seats</h6>
                                <div class="selected-seats-tags">
                                    ${seatsDisplay}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="price-summary mt-4">
                        <div class="price-details">
                            <div class="price-row">
                                <span>VIP Seats (${
                                  bookingData.seats.filter((s) => s.isVIP)
                                    .length
                                })</span>
                                <span>KES ${
                                  elements.vipTotalDisplay?.textContent || "0"
                                }</span>
                            </div>
                            <div class="price-row">
                                <span>Regular Seats (${
                                  bookingData.seats.filter((s) => !s.isVIP)
                                    .length
                                })</span>
                                <span>KES ${
                                  elements.regularTotalDisplay?.textContent ||
                                  "0"
                                }</span>
                            </div>
                        </div>
                        <div class="total-price">
                            <h6 class="text-white mb-2">Total Amount</h6>
                            <p class="h4 mb-0">KES ${
                              elements.totalPriceDisplay?.textContent || "0"
                            }</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  // Add event listener to the back button
  const backButton = document.querySelector(
    "#bookingConfirmationModal .btn-secondary"
  );
  if (backButton) {
    backButton.onclick = handleBackToDetails;
  }

  elements.bookingConfirmationModal._bookingData = bookingData;
  elements.bookingConfirmationModal?.show();
}

// Update the confirm booking handler
function handleConfirmBooking() {
  const bookingData = elements.bookingConfirmationModal._bookingData;
  if (!bookingData) {
    console.error("No booking data found");
    return;
  }

  submitBooking(bookingData);
}

// Export necessary functions if needed
window.handleConfirmDetails = handleConfirmDetails;
window.handleContinueToDetails = handleContinueToDetails;
window.handleBackToDetails = handleBackToDetails;

// Add this function to set default date
function setDefaultDate() {
  if (elements.travelDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    elements.travelDateInput.value = formattedDate;
    elements.travelDateInput.min = formattedDate; // Prevent past dates

    // Check available times immediately on page load
    checkAndUpdateAvailableTimes();
  }
}

// Add the missing handleBackToDetails function
function handleBackToDetails(event) {
  if (event) {
    event.preventDefault();
  }

  // Mark as programmatic close to prevent reload
  if (elements.bookingConfirmationModal?._element) {
    elements.bookingConfirmationModal._element._programmaticClose = true;
  }

  // Hide confirmation modal and show passenger details modal
  elements.bookingConfirmationModal?.hide();
  elements.passengerDetailsModal?.show();

  // Reset the programmatic flag
  if (elements.bookingConfirmationModal?._element) {
    elements.bookingConfirmationModal._element._programmaticClose = false;
  }
}

// Update checkAndUpdateAvailableTimes function
function checkAndUpdateAvailableTimes() {
  if (!elements.departureTimeSelect) return;

  const selectedDate = new Date(elements.travelDateInput.value);
  const dayOfWeek = selectedDate
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // Get times for selected day from schedule
  const availableTimes = routeData.schedule[dayOfWeek] || [];

  // Clear existing options
  elements.departureTimeSelect.innerHTML = "";

  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  // Filter and add valid times
  let hasValidTimes = false;

  if (isToday) {
    // For today, filter times that are at least 1 hour in the future
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    availableTimes.forEach((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const departureMinutes = hours * 60 + minutes;

      if (departureMinutes >= currentTotalMinutes + 60) {
        const option = new Option(time, time);
        elements.departureTimeSelect.add(option);
        hasValidTimes = true;
      }
    });
  } else {
    // For future dates, add all times
    availableTimes.forEach((time) => {
      const option = new Option(time, time);
      elements.departureTimeSelect.add(option);
      hasValidTimes = true;
    });
  }

  // Update UI based on availability
  if (!hasValidTimes) {
    // Show no buses available message
    if (elements.seatMap) {
      elements.seatMap.innerHTML = `
                <div class="alert alert-warning text-center my-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No available buses for ${
                      isToday ? "today" : "the selected date"
                    }. Please select a different date.
                </div>
            `;
    }

    // Disable controls
    elements.departureTimeSelect.innerHTML =
      "<option disabled>No available times</option>";
    elements.departureTimeSelect.setAttribute("disabled", "disabled");
    elements.continueButton?.setAttribute("disabled", "disabled");

    // Reset any selected seats
    resetSelectedSeats();
  } else {
    // Re-enable controls and update seat map
    elements.departureTimeSelect.removeAttribute("disabled");
    elements.continueButton?.removeAttribute("disabled");
    createSeatMap();
    updateSeatAvailability();
  }
}

// Contact form handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
                submitBtn.disabled = true;
                
                // Add your contact form submission logic here
                utils.showToast('Success', 'Message sent successfully!', 'success');
                this.reset();
            } catch (error) {
                utils.showToast('Error', 'Failed to send message', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
