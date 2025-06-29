// API Configuration
const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const verificationForm = document.getElementById('verificationForm');
const pendingApproval = document.getElementById('pendingApproval');
const adminDashboard = document.getElementById('adminDashboard');
const userDashboard = document.getElementById('userDashboard');

// Navigation
document.getElementById('showSignup').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    document.getElementById('signupFormElement').reset();
    // Reset password toggle icons for signup form
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
    [loginForm, signupForm, verificationForm, pendingApproval, adminDashboard, userDashboard]
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
            } else {
                loadUserDashboard(data.user);
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
            
            displayDriverRequests(data.pendingDrivers);
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
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

async function approveDriver(driverId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/approve-driver/${driverId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Refresh dashboard
        if (response.ok) {
            loadAdminDashboard(); 
            alert('Driver approved successfully!');
        }
    } catch (error) {
        alert('Failed to approve driver.');
    }
}

async function rejectDriver(driverId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/reject-driver/${driverId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Refresh dashboard
        if (response.ok) {
            loadAdminDashboard(); 
            alert('Driver application rejected.');
        }
    } catch (error) {
        alert('Failed to reject driver.');
    }
}

// User Dashboard
function loadUserDashboard(user) {
    hideAllForms();
    userDashboard.classList.remove('hidden');
    
    document.getElementById('userWelcome').textContent = `Welcome, ${user.name}!`;
    document.getElementById('userRole').textContent = `Logged in as ${user.role}`;
}

// Logout handlers
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('userLogoutBtn').addEventListener('click', logout);

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    hideAllForms();
    loginForm.classList.remove('hidden');
    
    // Clear form inputs
    document.getElementById('loginFormElement').reset();

    // Reset password toggle icon for login form
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
    
    // Check if user is already logged in
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
            loadAdminDashboard();
        } else {
            loadUserDashboard(user);
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

            //Redirect to login page and clear the token from URL
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