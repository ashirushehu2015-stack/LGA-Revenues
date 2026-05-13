// Initialize Feather Icons
feather.replace();

// Auth & Session Management
const currentUser = JSON.parse(localStorage.getItem('lga_user') || '{}');
if (currentUser.name) {
    document.querySelector('.user-name').textContent = currentUser.name;
    document.querySelector('.user-role').textContent = currentUser.role;
    document.querySelector('.avatar').textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// LGA Sidebar Logic
const LGAS = [
    "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", 
    "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", 
    "Tsafe", "Zurmi"
];

function initLgaSidebar() {
    const list = document.getElementById('sidebarLgaList');
    if (!list) return;
    if (currentUser.role !== 'Super Admin') {
        list.innerHTML = `<div class="lga-item active">${currentUser.lga || 'Assigned LGA'}</div>`;
        return;
    }
    let html = `<div class="lga-item" onclick="switchLga('System-wide')">System-wide</div>`;
    LGAS.forEach(lga => {
        html += `<div class="lga-item" onclick="switchLga('${lga}')">${lga}</div>`;
    });
    list.innerHTML = html;
}

window.switchLga = function(lga) {
    window.location.href = `index.html?lga=${encodeURIComponent(lga)}`;
};

initLgaSidebar();

// Logout Logic
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('lga_user');
    window.location.href = 'landing.html';
});

// DOM Elements
const userModal = document.getElementById('userModal');
const addUserBtn = document.getElementById('addUserBtn');
const closeBtns = document.querySelectorAll('.close-modal');
const userForm = document.getElementById('userForm');
const usersTableBody = document.getElementById('usersTableBody');
const usersEmptyState = document.getElementById('usersEmptyState');

// Role dependency
const userRoleSelect = document.getElementById('userRole');
const userLgaSelect = document.getElementById('userLga');

// State Management
let users = [];
let filteredUsers = [];
const userSearch = document.getElementById('userSearch');

// Fetch users from server
async function fetchUsers() {
    try {
        const response = await LgaConnection.apiFetch('/api/users');
        users = await response.json();
        filteredUsers = [...users];
        renderTable();
    } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to load users from server.', 'error');
    }
}

// Logic: If Super Admin, LGA is not strictly required. If LGA Admin or Revenue Officer, LGA is required.
userRoleSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Super Admin') {
        userLgaSelect.value = '';
        userLgaSelect.removeAttribute('required');
    } else {
        userLgaSelect.setAttribute('required', 'true');
        if (userLgaSelect.value === '') {
            // Prompt selection
        }
    }
});

// Modal Logic
function openModal() {
    userModal.classList.add('active');
}

function closeModal() {
    userModal.classList.remove('active');
    userForm.reset();
}

addUserBtn.addEventListener('click', openModal);
closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

userModal.addEventListener('click', (e) => {
    if (e.target === userModal) {
        closeModal();
    }
});

// Delete user
window.deleteUser = function(id) {
    if (id === '1') {
        showToast('Cannot delete the master Super Admin account.', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
        LgaConnection.apiFetch(`/api/users/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            users = users.filter(u => u.id !== id);
            renderTable();
            showToast('User deleted from server.', 'success');
        })
        .catch(err => {
            console.error('Delete error:', err);
            showToast('Failed to delete user from server.', 'error');
        });
    }
};

// Render Table
function renderTable() {
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        usersEmptyState.style.display = 'flex';
        usersTableBody.parentElement.style.display = 'none';
        return;
    }
    
    usersEmptyState.style.display = 'none';
    usersTableBody.parentElement.style.display = 'table';

    filteredUsers.forEach((t) => {
        const tr = document.createElement('tr');
        
        // Dynamic badge color based on role
        let roleBadgeStyle = '';
        if (t.role === 'Super Admin') roleBadgeStyle = 'color: var(--primary); font-weight: 700;';
        else if (t.role === 'LGA Admin') roleBadgeStyle = 'color: var(--amber-500); font-weight: 600;';
        else if (t.role === 'Field Officer') roleBadgeStyle = 'color: var(--purple-500); font-weight: 600;';
        else roleBadgeStyle = 'color: var(--emerald-500); font-weight: 600;';

        tr.innerHTML = `
            <td class="fw-600">${t.name}</td>
            <td>${t.email}</td>
            <td><span style="${roleBadgeStyle}">${t.role}</span></td>
            <td class="fw-600">${t.lga || 'System-wide'}</td>
            <td><span class="status-badge ${t.status === 'Active' ? 'status-completed' : ''}" style="${t.status !== 'Active' ? 'background-color: var(--danger-light); color: var(--danger);' : ''}">${t.status}</span></td>
            <td>
                <button class="btn btn-text" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="deleteUser('${t.id}')">Delete</button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

// Handle Form Submit
userForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const role = document.getElementById('userRole').value;
    const lga = document.getElementById('userLga').value;

    if (role !== 'Super Admin' && !lga) {
        showToast('Please select an assigned LGA for this role.', 'warning');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name: document.getElementById('userName').value,
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        role: role,
        lga: role === 'Super Admin' ? 'System-wide' : lga,
        status: document.getElementById('userStatus').value
    };

    // Save to server
    LgaConnection.apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    })
    .then(res => res.json())
    .then(data => {
        users.push(newUser);
        renderTable();
        closeModal();
        showToast('User saved to server.', 'success');
    })
    .catch(err => {
        console.error('Error saving user:', err);
        showToast('Failed to save user to server.', 'error');
    });
});

// Toast Helper (Duplicated from app.js for standalone users.js functionality)
function showToast(message, type = 'success') {
    const existing = document.getElementById('lga-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'lga-toast';
    toast.className = `lga-toast lga-toast-${type}`;
    toast.innerHTML = `
        <i data-feather="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'x-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    feather.replace();

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Search Logic
if (userSearch) {
    userSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            filteredUsers = [...users];
        } else {
            filteredUsers = users.filter(u => 
                (u.name || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query) ||
                (u.lga || '').toLowerCase().includes(query) ||
                (u.role || '').toLowerCase().includes(query)
            );
        }
        renderTable();
    });
}

// Status Indicator
const statusPill = document.getElementById('serverStatusPill');
if (statusPill) {
    const statusText = statusPill.querySelector('span');
    LgaConnection.onStatusChange((status) => {
        statusPill.className = `connection-pill ${status}`;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    });
}

// Initial Render
fetchUsers();
