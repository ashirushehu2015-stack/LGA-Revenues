// Initialize Feather Icons
feather.replace();

// Global State
const LGAS = [
    "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", 
    "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", 
    "Tsafe", "Zurmi"
];
let currentContextLga = 'System-wide';

// Auth & Session Management
const currentUser = JSON.parse(localStorage.getItem('lga_user') || '{}');
if (currentUser.name) {
    document.querySelector('.user-name').textContent = currentUser.name;
    document.querySelector('.user-role').textContent = currentUser.role;
    document.querySelector('.avatar').textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    // Lock LGA Admin to their specific LGA
    if (currentUser.role !== 'Super Admin' && currentUser.lga && currentUser.lga !== 'System-wide') {
        currentContextLga = currentUser.lga;
    } else {
        // Check query param for Super Admin
        const urlParams = new URLSearchParams(window.location.search);
        const paramLga = urlParams.get('lga');
        if (paramLga && (LGAS.includes(paramLga) || paramLga === 'System-wide')) {
            currentContextLga = paramLga;
        }
    }
}

// Update Title based on context
function updateTitle() {
    const titleEl = document.querySelector('.header-title h1');
    if (titleEl) {
        titleEl.textContent = currentContextLga === 'System-wide' ? 'Revenue Overview' : `${currentContextLga} Dashboard`;
    }
}
updateTitle();

// Logout Logic
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('lga_user');
    window.location.href = 'landing.html';
});

// DOM Elements
const modal = document.getElementById('revenueModal');
const addRevenueBtn = document.getElementById('addRevenueBtn');
const closeBtns = document.querySelectorAll('.close-modal');
const revenueForm = document.getElementById('revenueForm');
const transactionsTableBody = document.getElementById('transactionsTableBody');
const emptyState = document.getElementById('emptyState');
// Using a more robust selector for the search bar
const tableSearch = document.getElementById('tableSearch') || document.querySelector('.topbar-search input') || document.querySelector('.search-bar input');

// Stats Elements
const totalRevenueEl = document.getElementById('totalRevenue');
const totalCollectedEl = document.getElementById('totalCollected');
const totalTransactionsEl = document.getElementById('totalTransactions');
const totalLgasEl = document.getElementById('totalLgas');
const lgaStatsLabel = document.getElementById('lgaStatsLabel');

// // Tax Categories State (Fetched from server)
let taxCategories = [];

async function fetchTaxRates() {
    try {
        const res = await LgaConnection.apiFetch('/api/tax-rates');
        taxCategories = await res.json();
        renderTaxButtons();
    } catch (e) {
        console.error('Failed to fetch tax rates');
    }
}
fetchTaxRates();

function renderTaxButtons() {
    const taxButtonsContainer = document.getElementById('taxButtonsContainer');
    if (!taxButtonsContainer) return;
    taxButtonsContainer.innerHTML = '';
    
    taxCategories.forEach(category => {
        const header = document.createElement('div');
        header.className = 'tax-category-header';
        header.textContent = category.categoryName;
        taxButtonsContainer.appendChild(header);

        category.taxes.forEach(tax => {
            const btn = document.createElement('div');
            btn.className = 'tax-btn';
            btn.textContent = tax.name;
            btn.dataset.name = tax.name;
            btn.dataset.urban = tax.urban;
            btn.dataset.semiUrban = tax.semiUrban;
            btn.dataset.subUrban = tax.subUrban;
            btn.dataset.duration = tax.duration;
            
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
                toggleValuationField();
                updateLiveCalculator();
            });
            
            taxButtonsContainer.appendChild(btn);
        });
    });
}

/**
 * Shared calculation logic for Smart Tax Calculator and Form Submission
 */
function calculateTaxes(selectedBtns, selectedArea, assessmentValue) {
    return selectedBtns.map(btn => {
        const rateStr = btn.dataset[selectedArea];
        let amount = 0;
        let rateType = 'Flat';

        if (rateStr && (rateStr.includes('%') || rateStr.toLowerCase().includes('value'))) {
            rateType = 'Percentage';
            const pctMatch = rateStr.match(/([0-9.]+)%/);
            if (pctMatch && assessmentValue > 0) {
                const pct = parseFloat(pctMatch[1]);
                amount = Math.round((pct / 100) * assessmentValue);
            }
        } else if (!isNaN(rateStr) && rateStr !== '') {
            amount = Number(rateStr);
        } else {
            rateType = rateStr || 'Variable';
        }

        return {
            id: 'tax-' + Math.random().toString(36).substring(2, 9),
            name: btn.dataset.name,
            amount: amount,
            rateType: rateType,
            assessmentValue: rateType === 'Percentage' ? assessmentValue : null,
            duration: btn.dataset.duration || 'Yearly',
            status: 'Pending'
        };
    });
}

function updateLiveCalculator() {
    const calculatorWidget = document.getElementById('taxCalculatorSummary');
    const selectedTaxesList = document.getElementById('selectedTaxesList');
    const liveTotalDisplay = document.getElementById('liveTotalDisplay');
    const selectedBtns = Array.from(taxButtonsContainer.querySelectorAll('.tax-btn.selected'));
    const selectedArea = document.getElementById('areaClass').value;
    const assessmentValue = parseFloat(document.getElementById('assessmentValue').value) || 0;

    if (selectedBtns.length === 0) {
        calculatorWidget.style.display = 'none';
        return;
    }

    calculatorWidget.style.display = 'block';
    const taxes = calculateTaxes(selectedBtns, selectedArea, assessmentValue);
    
    let total = 0;
    selectedTaxesList.innerHTML = taxes.map(tax => {
        total += tax.amount;
        const amountDisplay = tax.amount > 0 ? `₦${tax.amount.toLocaleString()}` : `<span style="color:var(--amber-500)">${tax.rateType}</span>`;
        return `
            <div class="mini-tax-item">
                <span class="tax-name">${tax.name}</span>
                <span class="tax-amount">${amountDisplay}</span>
            </div>
        `;
    }).join('');

    liveTotalDisplay.textContent = `₦${total.toLocaleString()}`;
}

function smartTaxSuggest() {
    const query = document.getElementById('lineOfBusiness').value.toLowerCase().trim();
    const taxButtons = taxButtonsContainer.querySelectorAll('.tax-btn');
    
    taxButtons.forEach(btn => {
        const taxName = btn.dataset.name.toLowerCase();
        btn.classList.remove('suggested');
        
        if (query.length > 2 && taxName.includes(query)) {
            btn.classList.add('suggested');
        }
    });
}

// Add listeners for live updates
document.getElementById('lineOfBusiness')?.addEventListener('input', smartTaxSuggest);
document.getElementById('areaClass')?.addEventListener('change', () => {
    toggleValuationField();
    updateLiveCalculator();
});
document.getElementById('assessmentValue')?.addEventListener('input', updateLiveCalculator);

function toggleValuationField() {
    const selectedArea = document.getElementById('areaClass').value;
    const valuationGroup = document.getElementById('valuationGroup');
    const selectedBtns = Array.from(taxButtonsContainer.querySelectorAll('.tax-btn.selected'));
    
    const needsValuation = selectedBtns.some(btn => {
        const rate = btn.dataset[selectedArea];
        return rate && (rate.includes('%') || rate.toLowerCase().includes('value'));
    });
    
    valuationGroup.style.display = needsValuation ? 'block' : 'none';
}

document.getElementById('areaClass')?.addEventListener('change', toggleValuationField);

// State Management
let transactions = [];
let filteredTransactions = []; // State for filtered views (like search)
let editId = null; // Track record being edited

// --- LGA Sidebar Navigation ---
function initLgaSidebar() {
    const list = document.getElementById('sidebarLgaList');
    if (!list) return;

    if (currentUser.role !== 'Super Admin') {
        // Enforce context lock: LGA Admins cannot switch LGAs
        currentContextLga = currentUser.lga;
        list.innerHTML = `<div class="lga-item active">${currentContextLga}</div>`;
        
        // Hide administrative navigation
        const restricted = document.querySelectorAll('a[href="users.html"], a[href="settings.html"]');
        restricted.forEach(el => el.style.display = 'none');
        return;
    }

    let html = `<div class="lga-item ${currentContextLga === 'System-wide' ? 'active' : ''}" onclick="switchLga('System-wide')">System-wide</div>`;
    LGAS.forEach(lga => {
        const isActive = currentContextLga === lga;
        html += `<div class="lga-item ${isActive ? 'active' : ''}" onclick="switchLga('${lga}')">${lga}</div>`;
    });
    list.innerHTML = html;
}

window.switchLga = function(lga) {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        currentContextLga = lga;
        updateTitle();
        initLgaSidebar();
        fetchRevenues();
        // Update URL without refresh
        const newUrl = lga === 'System-wide' ? 'index.html' : `index.html?lga=${encodeURIComponent(lga)}`;
        window.history.pushState({ lga }, '', newUrl);
    } else {
        window.location.href = `index.html?lga=${encodeURIComponent(lga)}`;
    }
};

initLgaSidebar();

// Global config fetched from server
let serverSettings = {
    paystackPublicKey: '',
    paystackMode: 'test'
};

async function fetchSettings() {
    try {
        const res = await LgaConnection.apiFetch('/api/settings');
        serverSettings = await res.json();
    } catch (e) {
        console.warn('Could not fetch server settings');
    }
}

// Fetch data from server
async function fetchRevenues() {
    await fetchSettings();
    try {
        let url = currentContextLga === 'System-wide' 
            ? '/api/revenues' 
            : `/api/revenues?lga=${encodeURIComponent(currentContextLga)}`;
        
        // Individual capture filter for non-Super Admins
        if (currentUser.role !== 'Super Admin' && currentUser.id) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}capturedBy=${encodeURIComponent(currentUser.id)}`;
        }

        const response = await LgaConnection.apiFetch(url);
        transactions = await response.json();
        filteredTransactions = [...transactions]; // Sync filtered list
        updateDashboard();
        renderTable();
    } catch (error) {
        console.error('Error fetching revenues:', error);
        showToast('Server connection failed. Is the server running on port 3000?', 'error');
    }
}

// Removed old population logic (now handled by fetchTaxRates)

// Modal Elements
const reportModal = document.getElementById('reportModal');
const reportContentContainer = document.getElementById('reportContentContainer');
const printReportBtn = document.getElementById('printReportBtn');
const payOnlineBtn = document.getElementById('payOnlineBtn');
const bulkReportBtn = document.getElementById('bulkReportBtn');

function openModal() {
    editId = null;
    revenueForm.reset();
    document.querySelector('#revenueModal h2').textContent = 'Record Tax Details';
    modal.classList.add('active');
}

function closeModals() {
    modal.classList.remove('active');
    reportModal.classList.remove('active');
    editId = null;
    revenueForm.reset();
    
    // Reset tax buttons
    if (taxButtonsContainer) {
        taxButtonsContainer.querySelectorAll('.tax-btn').forEach(btn => {
            btn.classList.remove('selected', 'suggested');
        });
    }
    updateLiveCalculator();
}

addRevenueBtn.addEventListener('click', openModal);
closeBtns.forEach(btn => btn.addEventListener('click', closeModals));

// Close modal on click outside
[modal, reportModal].forEach(m => {
    m.addEventListener('click', (e) => {
        if (e.target === m) {
            closeModals();
        }
    });
});

// Removed formatDate and formatCurrency since amount and date were removed

// Update Dashboard Stats
function updateDashboard() {
    // Total Generation (Sum of ALL taxes)
    let totalGeneration = 0;
    // Total Collected (Sum of PAID taxes)
    let totalCollected = 0;
    let totalTaxItems = 0;
    
    transactions.forEach(t => {
        if (t.taxes && Array.isArray(t.taxes)) {
            t.taxes.forEach(tax => {
                totalTaxItems++;
                const amount = (tax.amount || 0);
                totalGeneration += amount;
                if (tax.status === 'Paid') {
                    totalCollected += (tax.amountPaid || amount);
                }
            });
        }
    });

    if (totalRevenueEl) totalRevenueEl.textContent = `₦${totalGeneration.toLocaleString()}`;
    if (totalCollectedEl) totalCollectedEl.textContent = `₦${totalCollected.toLocaleString()}`;

    // Update LGA Stats Label if in specific LGA context
    if (lgaStatsLabel) {
        lgaStatsLabel.textContent = currentContextLga === 'System-wide' ? 'LGAs Covered' : 'Active Context';
    }

    // Total Transactions (Using tax items count for more granularity, or keeping profiles count)
    if (totalTransactionsEl) totalTransactionsEl.textContent = transactions.length;

    // Total LGAs Covered
    if (totalLgasEl) {
        const uniqueLgas = new Set(transactions.map(t => t.lga || t.city).filter(Boolean));
        totalLgasEl.textContent = uniqueLgas.size;
    }
}

// Render Table
function renderTable() {
    transactionsTableBody.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        emptyState.style.display = 'flex';
        transactionsTableBody.parentElement.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    transactionsTableBody.parentElement.style.display = 'table';

    // Sort logically - latest first
    const sortedTransactions = [...filteredTransactions].reverse();

    sortedTransactions.forEach((t, index) => {
        // Detailed tax breakdown for table
        const taxNamesList = (t.taxes || []).map(tx => `<div class="tax-tag">${tx.name}</div>`).join('');
        const taxRatesList = (t.taxes || []).map(tx => {
            const display = tx.amount > 0 ? `₦${tx.amount.toLocaleString()}` : tx.rateType;
            return `<div class="rate-tag">${display}</div>`;
        }).join('');
        const taxStatusList = (t.taxes || []).map(tx => {
            const statusClass = tx.status === 'Paid' ? 'status-paid' : 'status-pending';
            return `<div class="status-tag-cell"><span class="status-badge ${statusClass}" style="padding: 2px 8px; font-size: 10px;">${tx.status}</span></div>`;
        }).join('');

        const totalPaid = (t.taxes || []).filter(tx => tx.status === 'Paid').reduce((acc, tx) => acc + tx.amount, 0);
        const totalAssigned = (t.taxes || []).reduce((acc, tx) => acc + tx.amount, 0);

        const tr = document.createElement('tr');
        const isPortal = t.origin === 'Portal';
        
        tr.innerHTML = `
            <td class="fw-600" style="color: var(--slate-500);">${index + 1}</td>
            <td class="fw-600">
                ${t.businessName || ''}
                ${isPortal ? '<span class="source-badge">Portal</span>' : ''}
            </td>
            <td>${t.businessAddress || ''}</td>
            <td>${t.lga || t.city || ''}</td>
            <td>${t.lineOfBusiness || ''}</td>
            <td><div class="tax-list-cell">${taxNamesList || 'None'}</div></td>
            <td><div class="rate-list-cell">${taxRatesList || '₦0'}</div></td>
            <td>${t.contactPerson || ''}</td>
            <td>${t.addressCp || ''}</td>
            <td>${t.phoneNumber || ''}</td>
            <td><div class="status-list-cell">${taxStatusList || '<span class="status-badge status-pending">Pending</span>'}</div></td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="openInvoice('${t.id}')" title="View Profile">
                        <i data-feather="user"></i>
                    </button>
                    <button class="icon-btn" onclick="editRevenue('${t.id}')" title="Edit Record" style="color: var(--primary);">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="icon-btn" onclick="deleteRevenue('${t.id}')" title="Delete Record" style="color: #ef4444;">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        transactionsTableBody.appendChild(tr);
    });
    feather.replace();
}

// Report Generation Template (Profile View)
function generateInvoiceHTML(t) {
    const dateStr = new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric' 
    });
    
    const refStr = t.invoiceRef || `LGA/PROFILE/${t.id.slice(-4).toUpperCase()}`;
    const lgaHeader = `${(t.lga || 'ZAMFARA').toUpperCase()} LGA`;

    // Render Taxes List
    const taxesListHTML = (t.taxes || []).map(tax => {
        const isPaid = tax.status === 'Paid';
        const amountDisplay = tax.amount > 0 ? `₦${tax.amount.toLocaleString()}` : tax.rateType;
        
        return `
            <div class="tax-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                    <p style="font-size: 11px; font-weight: 700; margin: 0;">${tax.name}</p>
                    <p style="font-size: 9px; color: #666; margin: 0;">Cycle: ${tax.duration}</p>
                    <p style="font-size: 10px; font-weight: 700; color: var(--primary); margin: 2px 0 0 0;">Amount: ${amountDisplay}</p>
                </div>
                <div style="text-align: right; min-width: 80px;">
                    ${isPaid ? 
                        `<span class="status-badge status-paid" style="font-size: 8px; padding: 2px 6px;">PAID</span>` : 
                        (tax.amount > 0 ? `<button class="btn-outline-sm no-print" onclick="paySingleTax('${t.id}', '${tax.id}')" style="font-size: 8px; padding: 2px 6px; border-color: var(--primary); color: var(--primary);">PAY NOW</button>` : `<span style="font-size: 8px; color: #f59e0b; font-weight: bold;">ASSESSMENT PENDING</span>`)
                    }
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="printable-report">
            <div class="report-header">
                <img src="logo.png" alt="Logo" class="report-logo">
                <div class="report-title-group">
                    <h1>ZAMFARA STATE GOVT</h1>
                    <h2>REV ADMINISTRATION</h2>
                    <p>${lgaHeader}</p>
                </div>
                <div class="invoice-badge">TAX PAYER PROFILE</div>
            </div>
            
            <div class="report-meta">
                <div class="report-meta-item">
                    <span class="label">Date:</span>
                    <span class="value">${dateStr}</span>
                </div>
                <div class="report-meta-item">
                    <span class="label">ID:</span>
                    <span class="value" style="color: var(--primary);">${refStr}</span>
                </div>
            </div>

            <div class="report-section">
                <h3>TAXPAYER INFO</h3>
                <div class="report-grid">
                    <div class="grid-item">
                        <span class="label">Name</span>
                        <span class="value">${t.contactPerson}</span>
                    </div>
                    <div class="grid-item">
                        <span class="label">Business</span>
                        <span class="value">${t.businessName}</span>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>ASSIGNED TAXES</h3>
                <div class="taxes-container" style="background: #fcfcfc; padding: 0 10px; border-radius: 4px; border: 1px solid #eee;">
                    ${taxesListHTML || '<p style="font-size: 10px; padding: 10px; text-align: center;">No taxes assigned</p>'}
                </div>
            </div>

            <div class="report-section bank-instructions">
                <p><strong>BANK INSTRUCTIONS:</strong><br>
                Use Ref: <strong>${refStr}</strong> to pay at any bank for <strong>${lgaHeader}</strong>.</p>
            </div>

            <div class="report-footer">
                <div class="footer-note">
                    <p>Digital Tax Profile. Authorized government channels only.</p>
                </div>
                <div class="signature-area">
                    <div class="signature-box">
                        <div class="sig-line"></div>
                        <p>Revenue Officer</p>
                    </div>
                    <div class="stamp-box">STAMP</div>
                </div>
            </div>
        </div>
    `;
}

// Invoice Logic
window.openInvoice = function(id) {
    const t = transactions.find(item => item.id === id);
    if (!t) return;
    
    reportContentContainer.innerHTML = generateInvoiceHTML(t);
    reportModal.classList.add('active');
    
    // Handle Global Pay Online Button
    const unpaidTaxes = (t.taxes || []).filter(tx => tx.status !== 'Paid');
    const totalToPay = unpaidTaxes.reduce((acc, tx) => acc + (tx.amount || 0), 0);

    if (unpaidTaxes.length > 0) {
        payOnlineBtn.style.display = 'flex';
        const label = totalToPay > 0 ? `Pay Total (₦${totalToPay.toLocaleString()})` : 'Pay Taxes Online';
        payOnlineBtn.innerHTML = `<i data-feather="credit-card"></i> ${label}`;
        
        // Remove old listeners and add new one
        const newPayBtn = payOnlineBtn.cloneNode(true);
        payOnlineBtn.parentNode.replaceChild(newPayBtn, payOnlineBtn);
        
        newPayBtn.addEventListener('click', () => {
            // For simplicity, we pay the first unpaid tax item in the bulk flow
            // or we could implement a bulk payment on the server.
            // Here we'll just trigger the first one to demonstrate functionality.
            paySingleTax(t.id, unpaidTaxes[0].id);
        });
    } else {
        payOnlineBtn.style.display = 'none';
    }
    
    feather.replace();
};

window.editRevenue = function(id) {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    editId = id;
    document.querySelector('#revenueModal h2').textContent = 'Edit Revenue Record';
    
    // Fill basic fields
    document.getElementById('businessName').value = t.businessName || '';
    document.getElementById('businessAddress').value = t.businessAddress || '';
    document.getElementById('lga').value = t.lga || '';
    document.getElementById('lineOfBusiness').value = t.lineOfBusiness || '';
    document.getElementById('contactPerson').value = t.contactPerson || '';
    document.getElementById('addressCp').value = t.addressCp || '';
    document.getElementById('phoneNumber').value = t.phoneNumber || '';
    document.getElementById('status').value = t.status || 'Active';
    document.getElementById('areaClass').value = t.areaClass || 'urban';

    // Set assessment value if any tax is a percentage one
    const pTax = (t.taxes || []).find(tx => tx.rateType === 'Percentage');
    document.getElementById('assessmentValue').value = pTax ? pTax.assessmentValue : '';
    toggleValuationField();

    // Reset and Select taxes
    taxButtonsContainer.querySelectorAll('.tax-btn').forEach(btn => {
        btn.classList.remove('selected');
        const isSelected = (t.taxes || []).some(tx => tx.name === btn.dataset.name);
        if (isSelected) btn.classList.add('selected');
    });

    modal.classList.add('active');
    updateLiveCalculator();
};

window.deleteRevenue = async function(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
        const res = await LgaConnection.apiFetch(`/api/revenues/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Record deleted successfully', 'success');
            fetchRevenues();
        } else {
            showToast('Failed to delete record', 'error');
        }
    } catch (err) {
        showToast('Server error during deletion', 'error');
    }
};

window.paySingleTax = function(payerId, taxId) {
    const payer = transactions.find(p => p.id === payerId);
    if (!payer) return;
    
    const tax = payer.taxes.find(tx => tx.id === taxId);
    if (!tax) return;

    if (tax.amount <= 0) {
        const manualAmount = prompt(`This is a variable tax (${tax.rateType}).\n\nPlease enter the calculated amount to pay (₦):`, "");
        if (manualAmount === null || manualAmount === "" || isNaN(manualAmount)) {
            return;
        }
        tax.amount = parseFloat(manualAmount);
    }

    // SIMULATION CHECK
    const PAYSTACK_PUBLIC_KEY = serverSettings.paystackPublicKey;
    
    if (PAYSTACK_PUBLIC_KEY.includes('xxx')) {
        const choice = confirm("PAYMENT SIMULATION MODE\n\nNo live Paystack key detected.\n\nClick OK to SIMULATE a successful payment.\nClick Cancel to attempt real Paystack flow.");
        if (choice) {
            const simRef = 'SIM-' + Date.now();
            verifyPaymentOnServer(simRef, payer.id, tax.id);
            return;
        }
    }

    payWithPaystack(payer, tax);
};

async function payWithPaystack(payer, tax) {
    // Paystack expects amount in Kobo (Naira * 100)
    const amountKobo = tax.amount * 100;

    const PAYSTACK_PUBLIC_KEY = serverSettings.paystackPublicKey || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: 'taxpayer@example.com',
        amount: amountKobo,
        currency: 'NGN',
        ref: 'LGA-' + Date.now(),
        metadata: {
            custom_fields: [
                {
                    display_name: "Payer ID",
                    variable_name: "payer_id",
                    value: payer.id
                },
                {
                    display_name: "Tax ID",
                    variable_name: "tax_id",
                    value: tax.id
                },
                {
                    display_name: "Tax Name",
                    variable_name: "tax_name",
                    value: tax.name
                }
            ]
        },
        callback: function(response) {
            verifyPaymentOnServer(response.reference, payer.id, tax.id);
        },
        onClose: function() {
            showToast('Payment window closed.', 'warning');
        }
    });
    handler.openIframe();
}

async function verifyPaymentOnServer(reference, payerId, taxId) {
    showToast('Verifying payment...', 'info');
    
    try {
        const response = await LgaConnection.apiFetch(`/api/payments/verify/${reference}?id=${payerId}&taxId=${taxId}`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            showToast('Payment Successful!', 'success');
            // Refresh data
            await fetchRevenues();
            // Update modal content if it's open
            const updatedPayer = transactions.find(p => p.id === payerId);
            if (updatedPayer) {
                reportContentContainer.innerHTML = generateInvoiceHTML(updatedPayer);
            }
        } else {
            showToast('Payment verification failed.', 'error');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showToast('Error verifying payment.', 'error');
    }
}

bulkReportBtn.addEventListener('click', () => {
    // Generate reports for all currently visible (filtered) transactions
    if (filteredTransactions.length === 0) {
        showToast('No records to report.', 'info');
        return;
    }
    
    let combinedHTML = '';
    filteredTransactions.forEach(t => {
        combinedHTML += generateInvoiceHTML(t);
    });
    
    reportContentContainer.innerHTML = combinedHTML;
    reportModal.classList.add('active');
    feather.replace();
});

printReportBtn.addEventListener('click', () => {
    window.print();
});

// Handle Form Submit
revenueForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedArea = document.getElementById('areaClass').value;
    const assessmentValue = parseFloat(document.getElementById('assessmentValue').value) || 0;
    
    const selectedBtns = Array.from(taxButtonsContainer.querySelectorAll('.tax-btn.selected'));
    const selectedTaxes = calculateTaxes(selectedBtns, selectedArea, assessmentValue);

    const newTransaction = {
        id: editId || Date.now().toString(),
        businessName: document.getElementById('businessName').value,
        businessAddress: document.getElementById('businessAddress').value,
        lga: document.getElementById('lga').value,
        areaClass: selectedArea,
        lineOfBusiness: document.getElementById('lineOfBusiness').value,
        contactPerson: document.getElementById('contactPerson').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        status: document.getElementById('status').value, // This is overall profile status
        origin: currentUser.role === 'Revenue Officer' ? 'Officer' : 'Admin',
        capturedBy: currentUser.id,
        capturedByName: currentUser.name,
        taxes: selectedTaxes
    };

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/revenues/${editId}` : '/api/revenues';

    // Save to server
    LgaConnection.apiFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
    })
    .then(res => res.json())
    .then(data => {
        if (editId) {
            const idx = transactions.findIndex(t => t.id === editId);
            if (idx !== -1) transactions[idx] = newTransaction;
        } else {
            transactions.push(newTransaction);
        }
        
        filteredTransactions = [...transactions]; 
        updateDashboard();
        renderTable();
        closeModals();
        showToast(editId ? 'Record updated successfully.' : 'Record saved to server.', 'success');
        editId = null;
    })
    .catch(err => {
        console.error('Error saving:', err);
        showToast('Failed to save to server.', 'error');
    });
});

// Filter Transactions - Enhanced Listener
if (tableSearch) {
    const performSearch = (e) => {
        const query = (e.target.value || '').toLowerCase().trim();
        
        if (!query) {
            filteredTransactions = [...transactions];
        } else {
            filteredTransactions = transactions.filter(t => {
                const bName = (t.businessName || '').toLowerCase();
                const pName = (t.contactPerson || '').toLowerCase();
                const lga = (t.lga || t.city || '').toLowerCase();
                const job = (t.lineOfBusiness || '').toLowerCase();
                const phone = (t.phoneNumber || '').toLowerCase();
                
                // Deep search in assigned taxes
                const taxMatch = (t.taxes || []).some(tx => tx.name.toLowerCase().includes(query));
                
                return bName.includes(query) || 
                       pName.includes(query) || 
                       lga.includes(query) || 
                       job.includes(query) ||
                       phone.includes(query) ||
                       taxMatch;
            });
        }
        
        renderTable();
    };

    tableSearch.addEventListener('input', performSearch);
    tableSearch.addEventListener('keyup', performSearch);
}

// Dashboard Status Indicator logic
const statusPill = document.getElementById('serverStatusPill');
if (statusPill) {
    const statusText = statusPill.querySelector('span');
    LgaConnection.onStatusChange((status) => {
        statusPill.className = `connection-pill ${status}`;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    });
}

// Initial Render
fetchRevenues();

// ── Data Management ──────────────────────────────────────────────────────────

// Export Excel
document.getElementById('exportExcelBtn').addEventListener('click', () => {
    if (transactions.length === 0) {
        showToast('No records to export.', 'warning');
        return;
    }

    // Prepare data for Excel
    const excelData = transactions.map((t, i) => {
        const totalAmount = (t.taxes || []).reduce((acc, tx) => acc + tx.amount, 0);
        const totalPaid = (t.taxes || []).filter(tx => tx.status === 'Paid').reduce((acc, tx) => acc + tx.amount, 0);
        
        return {
            'S/N': i + 1,
            'Business Name': t.businessName || '',
            'Business Address': t.businessAddress || '',
            'LGA': t.lga || t.city || '',
            'Area Class': t.areaClass || 'Urban',
            'Line of Business': t.lineOfBusiness || '',
            'Contact Person': t.contactPerson || '',
            'Phone Number': t.phoneNumber || '',
            'Assigned Taxes': (t.taxes || []).map(tx => tx.name).join(', '),
            'Total Assessed (₦)': totalAmount,
            'Total Paid (₦)': totalPaid,
            'Balance Due (₦)': totalAmount - totalPaid,
            'Status': t.status || 'Active',
            'Source': t.origin || 'Admin'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Records");
    
    // Auto-size columns (simple approximation)
    const maxWidths = {};
    excelData.forEach(row => {
        Object.keys(row).forEach(key => {
            const val = String(row[key]);
            maxWidths[key] = Math.max(maxWidths[key] || 0, val.length, key.length);
        });
    });
    worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }));

    XLSX.writeFile(workbook, `lga_revenues_${formatFileDate()}.xlsx`);
    showToast(`Exported ${transactions.length} record(s) to Excel.`, 'success');
});

// Export CSV
document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (transactions.length === 0) {
        showToast('No records to export.', 'warning');
        return;
    }
    const headers = ['S/N','Business Name','Business Address','LGA','Area Class','Line of Business','Tax Items','Total Amount','Total Paid','Contact Person','Phone Number','Status'];
    const rows = transactions.map((t, i) => {
        const totalAmount = (t.taxes || []).reduce((acc, tx) => acc + tx.amount, 0);
        const totalPaid = (t.taxes || []).filter(tx => tx.status === 'Paid').reduce((acc, tx) => acc + tx.amount, 0);
        return [
            i + 1,
            csvEscape(t.businessName || ''),
            csvEscape(t.businessAddress || ''),
            csvEscape(t.lga || t.city || ''),
            csvEscape(t.areaClass || ''),
            csvEscape(t.lineOfBusiness || ''),
            csvEscape((t.taxes || []).length),
            csvEscape(totalAmount),
            csvEscape(totalPaid),
            csvEscape(t.contactPerson || ''),
            csvEscape(t.phoneNumber || ''),
            csvEscape(t.status || '')
        ];
    });
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lga_revenues_${formatFileDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${transactions.length} record(s) as CSV.`, 'success');
});

// Import JSON
document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('importJsonInput').click();
});

document.getElementById('importJsonInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target.result);
            if (!Array.isArray(imported)) throw new Error('Invalid format');

            const proceed = transactions.length === 0 ||
                confirm(`You already have ${transactions.length} record(s). Importing will REPLACE all existing data. Continue?`);

            if (proceed) {
                fetch('/api/revenues?overwrite=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(imported)
                })
                .then(res => res.json())
                .then(data => {
                    transactions = imported;
                    updateDashboard();
                    renderTable();
                    showToast(`Imported ${transactions.length} record(s) successfully to server.`, 'success');
                })
                .catch(err => {
                    console.error('Import error:', err);
                    showToast('Failed to import to server.', 'error');
                });
            }
        } catch {
            showToast('Invalid JSON file. Please use a valid backup file.', 'error');
        }
        // Reset input so the same file can be re-imported if needed
        e.target.value = '';
    };
    reader.readAsText(file);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileDate() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
}

function csvEscape(val) {
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
}

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

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Fade out after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
