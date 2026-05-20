// ── settings.js ──────────────────────────────────────────────────────────────
feather.replace();

// Auth & Session
const currentUser = JSON.parse(localStorage.getItem('lga_user') || '{}');
if (!currentUser.name) window.location.href = 'landing.html';

// LGA Sidebar Logic
const LGAS = [
    "Anka", "Bakura", "Birnin Magaji", "Bukkuyum", "Bungudu", "Gummi", 
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

if (currentUser.name) {
    document.querySelector('.user-name').textContent = currentUser.name;
    document.querySelector('.user-role').textContent = currentUser.role;
    document.querySelector('.avatar').textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
}

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('lga_user');
    window.location.href = 'landing.html';
});

// ── Storage key ───────────────────────────────────────────────────────────────
const SETTINGS_KEY = 'lga_revmax_settings';

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
    paystackPublicKey:  '',
    paystackSecretKey:  '',
    paystackMode:       'test',   // 'test' | 'live'
    orgName:            'Zamfara State Govt',
    orgSubtitle:        'Revenue Administration',
    orgEmail:           '',
    orgPhone:           '',
    simMode:            true,
    requireInvoice:     true,
    autoRef:            true,
    apiBaseUrl:         ''
};

// ── Load saved settings ───────────────────────────────────────────────────────
function loadSettings() {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
        return { ...DEFAULTS };
    }
}

// ── Save settings ─────────────────────────────────────────────────────────────
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Populate form from saved settings ────────────────────────────────────────
function populateForm(s) {
    document.getElementById('paystackPublicKey').value  = s.paystackPublicKey;
    document.getElementById('paystackSecretKey').value  = s.paystackSecretKey;
    document.getElementById('orgName').value            = s.orgName;
    document.getElementById('orgSubtitle').value        = s.orgSubtitle;
    document.getElementById('orgEmail').value           = s.orgEmail;
    document.getElementById('orgPhone').value           = s.orgPhone;
    document.getElementById('simMode').checked          = s.simMode;
    document.getElementById('requireInvoice').checked   = s.requireInvoice;
    document.getElementById('autoRef').checked          = s.autoRef;
    document.getElementById('apiBaseUrl').value         = s.apiBaseUrl;

    setMode(s.paystackMode);
    updatePaystackStatus(s);
}

// ── Test/Live mode toggle ─────────────────────────────────────────────────────
let currentMode = 'test';

function setMode(mode) {
    currentMode = mode;
    document.getElementById('testModeBtn').classList.toggle('active', mode === 'test');
    document.getElementById('liveModeBtn').classList.toggle('active', mode === 'live');

    // Swap placeholder text to hint which key format to use
    const pubInput = document.getElementById('paystackPublicKey');
    const secInput = document.getElementById('paystackSecretKey');
    if (mode === 'live') {
        pubInput.placeholder = 'Enter Live Public Key';
        secInput.placeholder = 'Enter Live Secret Key';
    } else {
        pubInput.placeholder = 'Enter Test Public Key';
        secInput.placeholder = 'Enter Test Secret Key';
    }
    feather.replace();
}

document.getElementById('testModeBtn').addEventListener('click', () => setMode('test'));
document.getElementById('liveModeBtn').addEventListener('click', () => setMode('live'));

// ── Paystack status indicator ─────────────────────────────────────────────────
function updatePaystackStatus(s) {
    const row  = document.getElementById('paystackStatus');
    const dot  = row.querySelector('.status-dot');
    const text = row.querySelector('span');

    const hasKeys = s.paystackPublicKey && !s.paystackPublicKey.includes('xxx')
                 && s.paystackSecretKey && !s.paystackSecretKey.includes('xxx');

    if (hasKeys) {
        dot.className  = 'status-dot live';
        text.innerHTML = `Live keys detected — <strong>${currentMode === 'live' ? 'Live Mode' : 'Test Mode'}</strong> active`;
    } else if (s.simMode) {
        dot.className  = 'status-dot pending';
        text.innerHTML = `No keys configured — running in <strong>Simulation Mode</strong>`;
    } else {
        dot.className  = 'status-dot pending';
        text.innerHTML = `No keys configured — payments will fail`;
    }
}

// ── Sim mode toggle instantly updates status ──────────────────────────────────
document.getElementById('simMode').addEventListener('change', () => {
    const s = collectForm();
    updatePaystackStatus(s);
});

// ── Collect form values into a settings object ────────────────────────────────
function collectForm() {
    return {
        paystackPublicKey: document.getElementById('paystackPublicKey').value.trim(),
        paystackSecretKey: document.getElementById('paystackSecretKey').value.trim(),
        paystackMode:      currentMode,
        orgName:           document.getElementById('orgName').value.trim(),
        orgSubtitle:       document.getElementById('orgSubtitle').value.trim(),
        orgEmail:          document.getElementById('orgEmail').value.trim(),
        orgPhone:          document.getElementById('orgPhone').value.trim(),
        simMode:           document.getElementById('simMode').checked,
        requireInvoice:    document.getElementById('requireInvoice').checked,
        autoRef:           document.getElementById('autoRef').checked,
        apiBaseUrl:        document.getElementById('apiBaseUrl').value.trim()
    };
}

// ── Save all button ───────────────────────────────────────────────────────────
document.getElementById('saveAllBtn').addEventListener('click', async () => {
    const s = collectForm();

    // If keys provided, push to server via env update endpoint
    if (s.paystackSecretKey && !s.paystackSecretKey.includes('xxx')) {
        try {
            await fetch('/api/settings/paystack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secretKey: s.paystackSecretKey,
                    publicKey: s.paystackPublicKey,
                    mode: s.paystackMode
                })
            });
        } catch (e) {
            // Server endpoint may not exist yet — settings are still saved locally
        }
    }

    saveSettings(s);
    
    // Update Connection Manager
    LgaConnection.baseUrl = s.apiBaseUrl;
    
    updatePaystackStatus(s);
    showToast('Settings saved successfully!', 'success');
    feather.replace();
});

// Topbar Status Indicator
const statusPill = document.getElementById('serverStatusPill');
if (statusPill) {
    const statusText = statusPill.querySelector('span');
    LgaConnection.onStatusChange((status) => {
        statusPill.className = `connection-pill ${status}`;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    });
}

// ── Field helpers ─────────────────────────────────────────────────────────────
window.copyField = function(id) {
    const el = document.getElementById(id);
    navigator.clipboard.writeText(el.value).then(() => {
        showToast('Copied to clipboard', 'success');
    });
};

window.toggleSecret = function(id) {
    const el = document.getElementById(id);
    el.type = el.type === 'password' ? 'text' : 'password';
    feather.replace();
};

// ── Export backup ─────────────────────────────────────────────────────────────
document.getElementById('exportBackupBtn').addEventListener('click', async () => {
    try {
        const res  = await fetch('/api/revenues');
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        const ts   = new Date().toISOString().slice(0, 10);
        a.download = `lga_revmax_backup_${ts}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${data.length} record(s).`, 'success');
    } catch (e) {
        showToast('Export failed. Is the server running?', 'error');
    }
});

// ── Clear all data ────────────────────────────────────────────────────────────
document.getElementById('clearDataBtn').addEventListener('click', async () => {
    const confirmed = confirm(
        '⚠️ WARNING\n\nThis will permanently delete ALL revenue records from the server.\n\nThis action cannot be undone.\n\nType OK to confirm.'
    );
    if (!confirmed) return;

    try {
        await fetch('/api/revenues?overwrite=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([])
        });
        showToast('All revenue records have been cleared.', 'warning');
    } catch (e) {
        showToast('Failed to clear data. Is the server running?', 'error');
    }
});

// ── Toast (standalone) ────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const existing = document.getElementById('lga-toast');
    if (existing) existing.remove();

    const iconMap = { success: 'check-circle', warning: 'alert-triangle', error: 'x-circle', info: 'info' };
    const toast   = document.createElement('div');
    toast.id        = 'lga-toast';
    toast.className = `lga-toast lga-toast-${type}`;
    toast.innerHTML = `<i data-feather="${iconMap[type] || 'info'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    feather.replace();

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
const settings = loadSettings();
populateForm(settings);
feather.replace();
