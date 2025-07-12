const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const verificationForm = document.getElementById('verificationForm');
const pendingApproval = document.getElementById('pendingApproval');
const adminDashboard = document.getElementById('adminDashboard');
const passengerDashboard = document.getElementById('passengerDashboard');
const driverDashboard = document.getElementById('driverDashboard');

// Navigation funtionalities
document.getElementById('showSignup').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    document.getElementById('signupFormElement').reset();
    ['signupPassword', 'confirmPassword'].forEach(id => {
        const toggle = document.querySelector(`.toggle-password[data-target="${id}"] i`);
        if (toggle) {
            toggle.classList.remove('fa-eye-slash');
            toggle.classList.add('fa-eye');
            document.getElementById(id).type = 'password';
        }
    });
});

document.getElementById('showLogin').addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

document.getElementById('backToLogin').addEventListener('click', () => {
    verificationForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

document.getElementById('backToLoginFromPending').addEventListener('click', () => {
    pendingApproval.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Utility Functions
function showAlert(elementId, message, type = 'error') {
    const alert = document.getElementById(elementId);
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

function hideAllForms() {
    [loginForm, signupForm, verificationForm, pendingApproval, adminDashboard, passengerDashboard, driverDashboard]
        .forEach(form => form.classList.add('hidden'));
}

// Login Handler
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'admin') {
                loadAdminDashboard();
            } else if (data.user.role === 'passenger') {
                loadPassengerDashboard(data.user);
            } else if (data.user.role === 'driver') {
                loadDriverDashboard(data.user);
            }
        } else {
            showAlert('loginAlert', data.message || 'Authentication failed. Invalid email or password.');
        }
    } catch (error) {
        showAlert('loginAlert', 'Connection error. Please try again.');
    }
});

// Signup Handler
document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const phone = document.getElementById('signupPhone').value;
    const userType = document.getElementById('signupUserType').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showAlert('signupAlert', 'Passwords do not match.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                phone,
                email,
                password,
                role: userType
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (userType === 'passenger') {
                hideAllForms();
                verificationForm.classList.remove('hidden');
            } else if (userType === 'driver') {
                hideAllForms();
                pendingApproval.classList.remove('hidden');
            }
        } else {
            showAlert('signupAlert', data.message || 'Registration failed.');
        }
    } catch (error) {
        showAlert('signupAlert', 'Connection error. Please try again.');
    }
});

// Password Show/Hide Toggle
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Admin Dashboard
async function loadAdminDashboard() {
    hideAllForms();
    adminDashboard.classList.remove('hidden');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('passengerCount').textContent = data.passengerCount;
            document.getElementById('driverCount').textContent = data.approvedDriverCount;
            document.getElementById('pendingCount').textContent = data.pendingDrivers.length;
            document.getElementById('busCount').textContent = data.pendingBuses.length;
            document.getElementById('bookingCount').textContent = data.totalBookings;
            
            displayDriverRequests(data.pendingDrivers);
            displayBusRequests(data.pendingBuses);
            displayModificationRequests(data.pendingModifications);
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }

    // Load analytics
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('analytics').innerHTML = `
                <p><strong>Total Passengers:</strong> ${data.totalPassengers}</p>
                <p><strong>Total Drivers:</strong> ${data.totalDrivers}</p>
                <p><strong>Total Buses:</strong> ${data.totalBuses}</p>
                <p><strong>Active Bookings:</strong> ${data.totalBookings}</p>
                <p><strong>Cancelled Bookings:</strong> ${data.cancelledBookings}</p>
            `;
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }

    // Load end locations
    loadLocationsForAdmin();
}

function displayDriverRequests(requests) {
    const container = document.getElementById('driverRequests');
    
    if (requests.length === 0) {
        container.innerHTML = '<p>No pending driver requests.</p>';
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <h4>Name: ${request.name}</h4>
            <p><strong>Email:</strong> ${request.email}</p>
            <p><strong>Phone:</strong> ${request.phone}</p>
            <p><strong>Applied:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
            <div class="request-actions">
                <button class="btn btn-approve" onclick="approveDriver('${request._id}')">Approve</button>
                <button class="btn btn-reject" onclick="rejectDriver('${request._id}')">Reject</button>
            </div>
        </div>
    `).join('');
}

// Display pending bus requests
function displayBusRequests(requests) {
    const container = document.getElementById('busRequests');
    
    if (requests.length === 0) {
        container.innerHTML = '<p>No pending bus requests.</p>';
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <h4>Bus Number: ${request.busNumber}</h4>
            <p><strong>Driver:</strong> ${request.driver.name} (${request.driver.email})</p>
            <p><strong>Route:</strong> Dublin to ${request.endLocation}</p>
            <p><strong>Start Time:</strong> ${new Date(request.startTime).toLocaleString()}</p>
            <p><strong>Max Seats:</strong> ${request.maxSeats}</p>
            <div class="request-actions">
                <button class="btn btn-approve" onclick="approveBus('${request._id}')">Approve</button>
                <button class="btn btn-reject" onclick="rejectBus('${request._id}')">Reject</button>
            </div>
        </div>
    `).join('');
}

// Display pending bus modification requests
function displayModificationRequests(requests) {
    const container = document.getElementById('modificationRequests');
    
    if (requests.length === 0) {
        container.innerHTML = '<p>No pending modification requests.</p>';
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-item">
            <h4>Bus ${request.busId.busNumber}</h4>
            <p><strong>Driver:</strong> ${request.driverId.name} (${request.driverId.email})</p>
            <p><strong>Request Type:</strong> ${request.type === 'update' ? 'Update Start Time' : 'Remove Bus'}</p>
            ${request.type === 'update' ? `
                <p><strong>Current Start Time:</strong> ${new Date(request.busId.startTime).toLocaleString()}</p>
                <p><strong>New Start Time:</strong> ${new Date(request.newStartTime).toLocaleString()}</p>
            ` : ''}
            <p><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
            <div class="request-actions">
                <button class="btn btn-approve" onclick="approveModification('${request._id}')">Approve</button>
                <button class="btn btn-reject" onclick="rejectModification('${request._id}')">Reject</button>
            </div>
        </div>
    `).join('');
}

// Admin Actions
async function approveDriver(driverId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/approve-driver/${driverId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadAdminDashboard(); 
            alert('Driver approved successfully!');
        }
    } catch (error) {
        alert('Failed to approve driver.');
    }
}

// Reject a driver application
async function rejectDriver(driverId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/reject-driver/${driverId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadAdminDashboard(); 
            alert('Driver application rejected.');
        }
    } catch (error) {
        alert('Failed to reject driver.');
    }
}

// Approve a bus request is done by this function
async function approveBus(busId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/approve-bus/${busId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadAdminDashboard(); 
            alert('Bus approved successfully!');
        }
    } catch (error) {
        alert('Failed to approve bus.');
    }
}

// Reject a bus request is done by this function
async function rejectBus(busId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/reject-bus/${busId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadAdminDashboard(); 
            alert('Bus rejected successfully!');
        }
    } catch (error) {
        alert('Failed to reject bus.');
    }
}

// Approve a bus modification request
async function approveModification(modificationId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/busModification/approve/${modificationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadAdminDashboard(); 
            alert('Modification approved successfully!');
        }
    } catch (error) {
        alert('Failed to approve modification.');
    }
}

// Reject a bus modification request
async function rejectModification(modificationId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/busModification/reject/${modificationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadAdminDashboard(); 
            alert('Modification rejected successfully!');
        }
    } catch (error) {
        alert('Failed to reject modification.');
    }
}

// Load end locations for admin
async function loadLocationsForAdmin() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/locations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const locations = await response.json();
        
        if (response.ok) {
            const container = document.getElementById('locationsList');
            container.innerHTML = locations.map(location => `
                <div class="location-item">
                    <span>${location.name}</span>
                    <button class="btn" onclick="deleteLocation('${location._id}')">Delete</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load end locations:', error);
    }
}

// Add new end location
document.getElementById('addLocationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('locationName').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/locations/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            document.getElementById('addLocationForm').reset();
            loadLocationsForAdmin();
            alert('End location added successfully!');
        }
    } catch (error) {
        alert('Failed to add end location.');
    }
});

// Delete an end location
async function deleteLocation(locationId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/locations/${locationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadLocationsForAdmin();
            alert('End location deleted successfully!');
        }
    } catch (error) {
        alert('Failed to delete end location.');
    }
}

// Passenger Dashboard
async function loadPassengerDashboard(user) {
    hideAllForms();
    passengerDashboard.classList.remove('hidden');
    
    document.getElementById('passengerWelcome').textContent = `Welcome, ${user.name}!`;
    
    // Load end locations for search
    try {
        const response = await fetch(`${API_BASE}/bus/locations`);
        const locations = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('endLocation');
            select.innerHTML = '<option value="">Select end location</option>' + 
                locations.map(loc => `<option value="${loc.name}">${loc.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load end locations:', error);
    }
    
    // Load booking history
    loadBookingHistory();
}

document.getElementById('searchBusForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const endLocation = document.getElementById('endLocation').value;
    const travelDate = document.getElementById('travelDate').value;
    
    try {
        const response = await fetch(`${API_BASE}/booking/search?endLocation=${endLocation}&date=${travelDate}`);
        const buses = await response.json();
        
        if (response.ok) {
            displayBusList(buses);
        }
    } catch (error) {
        console.error('Failed to search buses:', error);
    }
});

// Display bus list
function displayBusList(buses) {
    const container = document.getElementById('busList');
    
    if (buses.length === 0) {
        container.innerHTML = '<p>No buses available for this route.</p>';
        return;
    }
    
    container.innerHTML = buses.map(bus => {
        const isRecentlyUpdated = new Date(bus.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        return `
            <div class="bus-card ${bus.availableSeats === 0 ? 'full' : ''}">
                ${bus.availableSeats === 0 ? '<span class="badge">All Booked</span>' : ''}
                ${isRecentlyUpdated ? '<span class="badge badge-updated">Time Updated</span>' : ''}
                <h4>Bus ${bus.busNumber}</h4>
                <p><strong>Route:</strong> Dublin to ${bus.endLocation}</p>
                <p><strong>Start Time:</strong> ${new Date(bus.startTime).toLocaleString()}</p>
                <p><strong>Available Seats:</strong> ${bus.availableSeats}</p>
                ${bus.availableSeats > 0 ? `
                    <input type="number" id="seats-${bus._id}" min="1" max="${bus.availableSeats}" placeholder="Number of seats" required>
                    <button class="btn book-btn" onclick="bookBus('${bus._id}')">Book Now</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Book a bus
async function bookBus(busId) {
    const seats = document.getElementById(`seats-${busId}`).value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/booking/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ busId, seats: parseInt(seats) })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Booking successful!');
            loadPassengerDashboard(JSON.parse(localStorage.getItem('user')));
        } else {
            alert(data.message || 'Failed to book bus.');
        }
    } catch (error) {
        alert('Failed to book bus.');
    }
}

// Load booking history
async function loadBookingHistory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/booking/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const bookings = await response.json();
        
        if (response.ok) {
            const container = document.getElementById('bookingHistory');
            if (bookings.length === 0) {
                container.innerHTML = '<p>No bookings found.</p>';
                return;
            }
            
            container.innerHTML = bookings.map(booking => {
                const isRecentlyUpdated = new Date(booking.bus.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
                return `
                    <div class="request-item">
                        <h4>Bus ${booking.bus.busNumber}</h4>
                        <p><strong>Route:</strong> Dublin to ${booking.bus.endLocation}</p>
                        <p><strong>Start Time:</strong> ${new Date(booking.bus.startTime).toLocaleString()}</p>
                        <p><strong>Seats Booked:</strong> ${booking.seatsBooked}</p>
                        <p><strong>Status:</strong> ${booking.status}</p>
                        ${isRecentlyUpdated ? '<span class="badge badge-updated">Time Updated</span>' : ''}
                        ${booking.status === 'active' ? `
                            <button class="btn cancel-btn" onclick="cancelBooking('${booking._id}')">Cancel Booking</button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load booking history:', error);
    }
}

//cancel a booking
async function cancelBooking(bookingId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/booking/cancel/${bookingId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Booking cancelled successfully!');
            loadBookingHistory();
        }
    } catch (error) {
        alert('Failed to cancel booking.');
    }
}

// Driver Dashboard
async function loadDriverDashboard(user) {
    hideAllForms();
    driverDashboard.classList.remove('hidden');
    
    document.getElementById('driverWelcome').textContent = `Welcome, ${user.name}!`;
    
    // Load end locations for bus form
    try {
        const response = await fetch(`${API_BASE}/bus/locations`);
        const locations = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('busEndLocation');
            select.innerHTML = '<option value="">Select end location</option>' + 
                locations.map(loc => `<option value="${loc.name}">${loc.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load end locations:', error);
    }
    
    // Load driver's buses and booking history
    loadDriverBuses();
    loadDriverBookingHistory();
}

document.getElementById('addBusForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const busNumber = document.getElementById('busNumber').value;
    const endLocation = document.getElementById('busEndLocation').value;
    const startTime = document.getElementById('startTime').value;
    const maxSeats = document.getElementById('maxSeats').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/bus/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                busNumber,
                endLocation,
                startTime,
                maxSeats: parseInt(maxSeats)
            })
        });
        
        if (response.ok) {
            document.getElementById('addBusForm').reset();
            loadDriverBuses();
            alert('Bus added successfully, awaiting admin approval.');
        }
    } catch (error) {
        alert('Failed to add bus.');
    }
});

// Load driver's buses

async function loadDriverBuses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/bus/driver-buses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const buses = await response.json();
        
        if (response.ok) {
            const container = document.getElementById('driverBusList');
            if (buses.length === 0) {
                container.innerHTML = '<p>No buses added.</p>';
                return;
            }
            
            container.innerHTML = buses.map(bus => `
                <div class="bus-card">
                    <h4>Bus ${bus.busNumber}</h4>
                    <p><strong>Route:</strong> Dublin to ${bus.endLocation}</p>
                    <p><strong>Start Time:</strong> ${new Date(bus.startTime).toLocaleString()}</p>
                    <p><strong>Seats Booked:</strong> ${bus.maxSeats - bus.availableSeats}</p>
                    <p><strong>Status:</strong> ${bus.isApproved ? 'Approved' : 'Pending Approval'}</p>
                    ${bus.isApproved ? `
                        <button class="btn btn-update" onclick="requestUpdateTime('${bus._id}', '${bus.startTime}')">Update Time</button>
                        <button class="btn btn-reject" onclick="requestRemoveBus('${bus._id}')">Remove</button>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load buses:', error);
    }
}

async function requestUpdateTime(busId, currentStartTime) {
    const newStartTime = prompt('Enter new start time (YYYY-MM-DDTHH:MM)', currentStartTime);
    if (!newStartTime) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/busModification/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                busId,
                type: 'update',
                newStartTime
            })
        });

        if (response.ok) {
            alert('Modification request submitted, awaiting admin approval.');
            loadDriverBuses();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to submit modification request.');
        }
    } catch (error) {
        alert('Failed to submit modification request.');
    }
}

// Request removal of a bus
async function requestRemoveBus(busId) {
    if (!confirm('Are you sure you want to request removal of this bus?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/busModification/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                busId,
                type: 'remove'
            })
        });

        if (response.ok) {
            alert('Removal request submitted, awaiting admin approval.');
            loadDriverBuses();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to submit removal request.');
        }
    } catch (error) {
        alert('Failed to submit removal request.');
    }
}

// Load driver's booking history
async function loadDriverBookingHistory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/bus/driver-bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const bookings = await response.json();
        
        if (response.ok) {
            const container = document.getElementById('driverBookingHistory');
            if (bookings.length === 0) {
                container.innerHTML = '<p>No bookings found.</p>';
                return;
            }
            
            container.innerHTML = bookings.map(booking => `
                <div class="request-item">
                    <h4>Bus ${booking.bus.busNumber}</h4>
                    <p><strong>Passenger:</strong> ${booking.passenger.name} (${booking.passenger.email})</p>
                    <p><strong>Route:</strong> Dublin to ${booking.bus.endLocation}</p>
                    <p><strong>Start Time:</strong> ${new Date(booking.bus.startTime).toLocaleString()}</p>
                    <p><strong>Seats Booked:</strong> ${booking.seatsBooked}</p>
                    <p><strong>Status:</strong> ${booking.status}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load driver booking history:', error);
    }
}

// Logout handlers
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('passengerLogoutBtn')?.addEventListener('click', logout);
document.getElementById('driverLogoutBtn')?.addEventListener('click', logout);

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    hideAllForms();
    loginForm.classList.remove('hidden');
    
    document.getElementById('loginFormElement').reset();
    
    const loginPasswordToggle = document.querySelector('.toggle-password[data-target="loginPassword"] i');
    if (loginPasswordToggle) {
        loginPasswordToggle.classList.remove('fa-eye-slash');
        loginPasswordToggle.classList.add('fa-eye');
        document.getElementById('loginPassword').type = 'password';
    }
}

// Check for verification token on page load
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        verifyEmail(token);
    }
    
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
            loadAdminDashboard();
        } else if (user.role === 'passenger') {
            loadPassengerDashboard(user);
        } else if (user.role === 'driver') {
            loadDriverDashboard(user);
        }
    }
});

async function verifyEmail(token) {
    try {
        const response = await fetch(`${API_BASE}/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) { 
            hideAllForms();
            loginForm.classList.remove('hidden');
            showAlert('loginAlert', 'Email verified successfully! You can now login.', 'success');
            window.history.replaceState({}, document.title, '/');
        } else {
            showAlert('loginAlert', data.message || 'Email verification failed.');
        }
    } catch (error) {
        showAlert('loginAlert', 'Verification failed. Please try again.');
    }
}

// Make functions global for onclick handlers
window.approveDriver = approveDriver;
window.rejectDriver = rejectDriver;
window.approveBus = approveBus;
window.rejectBus = rejectBus;
window.deleteLocation = deleteLocation;
window.bookBus = bookBus;
window.cancelBooking = cancelBooking;
window.requestUpdateTime = requestUpdateTime;
window.requestRemoveBus = requestRemoveBus;
window.approveModification = approveModification;
window.rejectModification = rejectModification;