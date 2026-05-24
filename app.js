// Initialize Feather Icons
feather.replace();

// Global State
const LGAS = [
    "Anka", "Bakura", "Birnin Magaji", "Bukkuyum", "Bungudu", "Gummi", 
    "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", 
    "Tsafe", "Zurmi"
];
let currentContextLga = 'System-wide';

// Auth & Session Management
const currentUser = JSON.parse(localStorage.getItem('lga_user') || '{}');

// Session Enforcement
if (!currentUser.name) {
    window.location.href = 'landing.html';
} else {
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
    localStorage.removeItem('lga_jwt_token');
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
const totalPendingEl = document.getElementById('totalPending');
const totalTransactionsEl = document.getElementById('totalTransactions');
const totalLgasEl = document.getElementById('totalLgas');
const lgaStatsLabel = document.getElementById('lgaStatsLabel');
const trendTotalGenerationEl = document.getElementById('trendTotalGeneration');
const trendCollectedEl = document.getElementById('trendCollected');
const trendPendingEl = document.getElementById('trendPending');
const trendTransactionsEl = document.getElementById('trendTransactions');

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

// Modal Tax Search
document.getElementById('modalTaxSearch')?.addEventListener('input', (e) => {
    renderTaxButtons(e.target.value);
});

function renderTaxButtons(filter = '') {
    const taxButtonsContainer = document.getElementById('taxButtonsContainer');
    if (!taxButtonsContainer) return;
    taxButtonsContainer.innerHTML = '';
    
    const searchTerm = filter.toLowerCase().trim();
    let totalMatches = 0;

    // Track which taxes were already selected so we can keep them highlighted
    const selectedTaxNames = new Set();
    if (editId) {
        const t = transactions.find(item => item.id === editId);
        if (t && t.taxes) t.taxes.forEach(tx => selectedTaxNames.add(tx.name));
    }
    // Also check current UI state for newly selected buttons
    const currentSelected = Array.from(document.querySelectorAll('.tax-btn.selected')).map(b => b.dataset.name);
    currentSelected.forEach(name => selectedTaxNames.add(name));

    taxCategories.forEach(category => {
        // Check if category name matches or any tax inside matches
        const catMatches = category.categoryName.toLowerCase().includes(searchTerm);
        const matchingTaxes = category.taxes.filter(tax => 
            catMatches || tax.name.toLowerCase().includes(searchTerm)
        );

        if (matchingTaxes.length > 0) {
            const header = document.createElement('div');
            header.className = 'tax-category-header';
            header.textContent = category.categoryName;
            taxButtonsContainer.appendChild(header);

            matchingTaxes.forEach(tax => {
                totalMatches++;
                const btn = document.createElement('div');
                btn.className = 'tax-btn';
                if (selectedTaxNames.has(tax.name)) btn.classList.add('selected');
                
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
        }
    });

    if (totalMatches === 0 && searchTerm !== '') {
        taxButtonsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--slate-400); width: 100%;">No taxes found matching "' + filter + '"</div>';
    }
    
    // Re-suggest based on Line of Business if needed
    smartTaxSuggest();
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
        
        // RBAC Enforcement:
        // 1. Super Admin & LGA Admin: Full view of records in their context.
        // 2. Revenue Officer & Field Officer: Restricted to only what they personally captured.
        const restrictedRoles = ['Revenue Officer', 'Field Officer'];
        if (restrictedRoles.includes(currentUser.role) && currentUser.id) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}capturedBy=${encodeURIComponent(currentUser.id)}`;
        }

        const response = await LgaConnection.apiFetch(url);
        transactions = await response.json();
        filteredTransactions = [...transactions]; // Sync filtered list
        updateDashboard();
        renderTable();
        renderReconciliationWidget();
    } catch (error) {
        console.error('Error fetching revenues:', error);
        showToast('Server connection failed. Is the server running on port 3000?', 'error');
    }
}

function renderReconciliationWidget() {
    const widget = document.getElementById('reconciliationWidget');
    const tbody = document.getElementById('reconciliationWidgetBody');
    if (!widget || !tbody) return;

    // Aggregate all tax items that have status = 'Pending Verification'
    const pendingItems = [];
    transactions.forEach(payer => {
        if (payer.taxes && Array.isArray(payer.taxes)) {
            payer.taxes.forEach(tax => {
                if (tax.status === 'Pending Verification') {
                    pendingItems.push({
                        payerId: payer.id,
                        businessName: payer.businessName,
                        taxId: tax.id,
                        taxName: tax.name,
                        amount: tax.manualAmount || tax.amount,
                        reference: tax.manualReference || 'N/A',
                        depositor: tax.manualDepositor || 'N/A',
                        method: tax.manualMethod || 'Manual',
                        date: tax.manualSubmissionDate ? new Date(tax.manualSubmissionDate).toLocaleDateString('en-GB') : 'N/A'
                    });
                }
            });
        }
    });

    if (pendingItems.length === 0) {
        widget.style.display = 'none';
        tbody.innerHTML = '';
        return;
    }

    widget.style.display = 'block';
    tbody.innerHTML = '';

    pendingItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-600">${item.businessName}</td>
            <td>${item.taxName}</td>
            <td class="fw-600">₦${item.amount.toLocaleString()}</td>
            <td style="font-family: monospace; color: var(--primary); font-weight: 700;">${item.reference}</td>
            <td>${item.depositor}</td>
            <td><span class="status-badge" style="background: rgba(99,102,241,0.1); color:#4f46e5; border:1px solid rgba(99,102,241,0.2); padding:2px 8px; border-radius:4px; font-size:11px;">${item.method}</span></td>
            <td>${item.date}</td>
            <td style="text-align: center;">
                <div style="display: inline-flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-primary btn-sm btn-approve-manual" onclick="verifyManualPayment('${item.payerId}', '${item.taxId}', 'approve')" style="background-color: #10b981; border: none; padding: 6px 10px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;" title="Approve Payment">
                        <i data-feather="check" style="width: 14px; height: 14px; color: white;"></i>
                    </button>
                    <button class="btn btn-outline btn-sm btn-reject-manual" onclick="verifyManualPayment('${item.payerId}', '${item.taxId}', 'reject')" style="border-color: #ef4444; color: #ef4444; background: transparent; padding: 6px 10px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;" title="Reject Payment">
                        <i data-feather="x" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    feather.replace();
}

window.verifyManualPayment = async function(payerId, taxId, action) {
    const confirmation = confirm(`Are you sure you want to ${action} this payment submission?`);
    if (!confirmation) return;

    try {
        const response = await LgaConnection.apiFetch('/api/payments/verify-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: payerId, taxId: taxId, action: action })
        });

        const data = await response.json();
        if (data.success) {
            showToast(`Payment successfully ${action}d!`, action === 'approve' ? 'success' : 'info');
            fetchRevenues(); // Refresh everything
        } else {
            showToast(`Verification failed: ${data.message}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server communication failed.', 'error');
    }
};

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
    
    // Reset tax search
    const searchInput = document.getElementById('modalTaxSearch');
    if (searchInput) {
        searchInput.value = '';
        renderTaxButtons(); // Reset buttons to full list
    }

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
        } else if (t.chargeRate) {
            // Legacy support for single-tax records
            totalTaxItems++;
            const amountMatch = (t.chargeRate || '').match(/₦?([0-9,]+)/);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
            totalGeneration += amount;
            if (t.status === 'Paid') {
                totalCollected += amount;
            }
        }
    });

    if (totalRevenueEl) totalRevenueEl.textContent = `₦${totalGeneration.toLocaleString()}`;
    if (totalCollectedEl) totalCollectedEl.textContent = `₦${totalCollected.toLocaleString()}`;
    
    // Total Pending is calculated as the difference
    let totalPending = totalGeneration - totalCollected;
    if (totalPendingEl) totalPendingEl.textContent = `₦${totalPending.toLocaleString()}`;

    // Update LGA Stats Label and Trend text if in specific LGA context
    if (lgaStatsLabel) {
        lgaStatsLabel.textContent = currentContextLga === 'System-wide' ? 'LGAs Covered' : 'Active Context';
        const trendEl = lgaStatsLabel.parentElement.querySelector('.stat-trend span');
        if (trendEl) trendEl.textContent = currentContextLga;
    }

    // Total Transactions (Using tax items count for more granularity, or keeping profiles count)
    if (totalTransactionsEl) totalTransactionsEl.textContent = transactions.length;

    // Total LGAs Covered
    if (totalLgasEl) {
        const uniqueLgas = new Set(transactions.map(t => t.lga || t.city).filter(Boolean));
        totalLgasEl.textContent = uniqueLgas.size;
    }

    // Calculate Overall Revenue Composition Percentages (Collected % + Pending % = Total Generation 100%)
    const overallTotal = totalGeneration || 0;
    const overallCollected = totalCollected || 0;
    const overallPending = totalPending || 0;

    const genPct = overallTotal > 0 ? 100.0 : 0.0;
    const collPct = overallTotal > 0 ? (overallCollected / overallTotal) * 100 : 0.0;
    const pendPct = overallTotal > 0 ? (overallPending / overallTotal) * 100 : 0.0;

    // Helper for financial card composition percentages
    function updateCompositionUI(el, pct, type) {
        if (!el) return;

        let iconName = 'percent';
        let bgStyle = '';
        let colorStyle = '';
        let pctText = `${pct.toFixed(1)}%`;

        if (type === 'total') {
            iconName = 'activity';
            bgStyle = 'rgba(99, 102, 241, 0.1)';
            colorStyle = '#6366f1';
            pctText = '100.0%';
        } else if (type === 'collected') {
            iconName = 'check-circle';
            bgStyle = 'rgba(16, 185, 129, 0.1)';
            colorStyle = '#10b981';
        } else if (type === 'pending') {
            iconName = 'clock';
            bgStyle = 'rgba(245, 158, 11, 0.1)';
            colorStyle = '#f59e0b';
        }

        el.className = `stat-trend ${type}`;
        el.style.color = colorStyle;
        el.style.backgroundColor = bgStyle;
        el.style.padding = '2px 6px';
        el.style.borderRadius = '4px';
        el.style.display = 'inline-flex';
        el.style.alignItems = 'center';
        el.style.gap = '2px';

        el.innerHTML = `
            <i data-feather="${iconName}" style="width: 12px; height: 12px; stroke-width: 3px;"></i>
            <span>${pctText}</span>
        `;
    }

    // Keep transaction growth calculation based on 30-Day periods
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    let currentTx = 0, prevTx = 0;

    transactions.forEach(t => {
        const timestamp = parseInt(t.id);
        if (isNaN(timestamp)) return; // Ignore non-numeric IDs

        let period = null;
        if (timestamp >= thirtyDaysAgo && timestamp <= now) {
            period = 'current';
        } else if (timestamp >= sixtyDaysAgo && timestamp < thirtyDaysAgo) {
            period = 'previous';
        }

        if (!period) return;

        if (period === 'current') {
            currentTx++;
        } else {
            prevTx++;
        }
    });

    function updateTrendUI(el, currentVal, prevVal) {
        if (!el) return;

        let pct = 0;
        if (prevVal === 0) {
            pct = currentVal > 0 ? 100.0 : 0.0;
        } else {
            pct = ((currentVal - prevVal) / prevVal) * 100;
        }

        const isPositive = pct > 0;
        const isNegative = pct < 0;

        let pctText = '';
        if (isPositive) {
            pctText = `+${pct.toFixed(1)}`;
        } else if (isNegative) {
            pctText = `${pct.toFixed(1)}`;
        } else {
            pctText = '0.0';
        }

        let iconName = 'minus';
        let bgStyle = 'rgba(100, 116, 139, 0.1)';
        let colorStyle = '#64748b';

        if (isPositive) {
            iconName = 'arrow-up-right';
            bgStyle = 'rgba(16, 185, 129, 0.1)';
            colorStyle = '#10b981';
        } else if (isNegative) {
            iconName = 'arrow-down-right';
            bgStyle = 'rgba(239, 68, 68, 0.1)';
            colorStyle = '#ef4444';
        }

        el.className = `stat-trend ${isPositive ? 'up' : (isNegative ? 'down' : 'flat')}`;
        el.style.color = colorStyle;
        el.style.backgroundColor = bgStyle;
        el.style.padding = '2px 6px';
        el.style.borderRadius = '4px';
        el.style.display = 'inline-flex';
        el.style.alignItems = 'center';
        el.style.gap = '2px';

        el.innerHTML = `
            <i data-feather="${iconName}" style="width: 12px; height: 12px; stroke-width: 3px;"></i>
            <span>${pctText}</span>
        `;
    }

    // Apply overall revenue compositions
    updateCompositionUI(trendTotalGenerationEl, genPct, 'total');
    updateCompositionUI(trendCollectedEl, collPct, 'collected');
    updateCompositionUI(trendPendingEl, pendPct, 'pending');

    // Apply transaction 30-day trend growth
    updateTrendUI(trendTransactionsEl, currentTx, prevTx);

    feather.replace();
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
// Official Receipt Template
function generateReceiptHTML(payer, taxId) {
    const tax = payer.taxes.find(tx => tx.id === taxId);
    if (!tax) return '<p>Error: Tax item not found.</p>';

    const dateStr = new Date(tax.paymentDate || new Date()).toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const refStr = tax.paymentReference || 'N/A';
    const lgaHeader = `${(payer.lga || 'ZAMFARA').toUpperCase()} LGA`;

    const verificationUrl = `${window.location.origin}/verify.html?ref=${encodeURIComponent(tax.paymentReference || tax.id)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

    return `
        <div class="printable-report receipt-mode">
            <div class="report-header">
                <img src="logo.png" alt="Logo" class="report-logo">
                <div class="report-title-group">
                    <h1>ZAMFARA STATE GOVT</h1>
                    <h2>OFFICIAL REVENUE RECEIPT</h2>
                    <p>${lgaHeader}</p>
                </div>
                <div class="invoice-badge" style="background-color: #059669;">PAYMENT CONFIRMED</div>
            </div>
            
            <div class="report-meta">
                <div class="report-meta-item">
                    <span class="label">Receipt No:</span>
                    <span class="value" style="color: #059669;">${refStr}</span>
                </div>
                <div class="report-meta-item">
                    <span class="label">Payment Date:</span>
                    <span class="value">${dateStr}</span>
                </div>
            </div>

            <div class="report-section">
                <h3>TAXPAYER DETAILS</h3>
                <div class="report-grid">
                    <div class="grid-item">
                        <span class="label">Payer</span>
                        <span class="value">${payer.contactPerson}</span>
                    </div>
                    <div class="grid-item">
                        <span class="label">Business</span>
                        <span class="value">${payer.businessName}</span>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>PAYMENT BREAKDOWN</h3>
                <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 11px; font-weight: 600; color: #64748b;">Description</span>
                        <span style="font-size: 11px; font-weight: 600; color: #64748b;">Amount</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 1px dashed #cbd5e1;">
                        <span style="font-size: 12px; font-weight: 700; color: #1e293b;">${tax.name}</span>
                        <span style="font-size: 13px; font-weight: 800; color: #059669;">₦${(tax.amountPaid || tax.amount).toLocaleString()}</span>
                    </div>
                    <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Collection Cycle: ${tax.duration}</div>
                </div>
            </div>

            <div class="report-section total-box" style="margin-top: 15px; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; text-align: center;">
                <p style="font-size: 10px; font-weight: 700; color: #166534; margin: 0;">TOTAL PAID</p>
                <h2 style="font-size: 22px; font-weight: 900; color: #166534; margin: 5px 0;">₦${(tax.amountPaid || tax.amount).toLocaleString()}</h2>
            </div>

            <div class="report-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div class="footer-note" style="background: #fff; border: 1px solid #eee; padding: 8px; border-radius: 4px; flex: 1; margin-right: 15px;">
                    <p>This is a digitally generated official receipt. <br> <strong>Security Code: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</strong></p>
                </div>
                <div class="signature-area" style="display: flex; align-items: center; gap: 15px;">
                    <div class="signature-box" style="text-align: center;">
                        <div class="sig-line" style="border-top: 1px solid #cbd5e1; width: 80px; margin-bottom: 4px;"></div>
                        <p style="font-size: 8px; margin: 0; color: #64748b;">Revenue Authority</p>
                    </div>
                    <div class="stamp-box" style="color: #059669; border: 2px solid #059669; border-radius: 4px; padding: 4px 8px; font-weight: 800; font-size: 12px; transform: rotate(-5deg); opacity: 0.7;">PAID</div>
                    <div class="qr-placeholder" style="text-align: center;">
                        <img src="${qrUrl}" alt="Verification QR Code" style="width: 50px; height: 50px; display: block; margin: 0 auto 2px auto; border-radius: 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <span style="font-size: 7px; font-weight: 800; color: #10b981; letter-spacing: 0.5px;">VERIFY</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Invoice Template
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
                    <p style="font-size: 10px; font-weight: 700; color: var(--slate-700); margin: 2px 0 0 0;">Amount: ${amountDisplay}</p>
                </div>
                <div style="text-align: right; min-width: 100px;">
                    ${isPaid ? 
                        `<button class="btn-outline-sm no-print" onclick="viewTaxReceipt('${t.id}', '${tax.id}')" style="font-size: 8px; padding: 2px 6px; border-color: #059669; color: #059669;">VIEW RECEIPT</button>` : 
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
    
    printReportBtn.innerHTML = '<i data-feather="printer"></i> Print Invoice';
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
    document.getElementById('password').value = t.password || '';

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

window.viewTaxReceipt = function(payerId, taxId) {
    const payer = transactions.find(p => p.id === payerId);
    if (!payer) return;
    
    reportContentContainer.innerHTML = generateReceiptHTML(payer, taxId);
    reportModal.classList.add('active');
    printReportBtn.innerHTML = '<i data-feather="printer"></i> Print Receipt';
    payOnlineBtn.style.display = 'none';
    feather.replace();
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
            
            // Show the Official Receipt immediately
            const updatedPayer = transactions.find(p => p.id === payerId);
            if (updatedPayer) {
                reportContentContainer.innerHTML = generateReceiptHTML(updatedPayer, taxId);
                reportModal.classList.add('active');
                
                // Switch top button to "Print Receipt" if it was "Print Invoice"
                printReportBtn.innerHTML = '<i data-feather="printer"></i> Print Receipt';
                payOnlineBtn.style.display = 'none';
                feather.replace();
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
        password: document.getElementById('password').value,
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

// ══════════════════════════════════════════════
// ═══ GRIEVANCES DASHBOARD WIDGET ═════════════
// ══════════════════════════════════════════════
async function loadGrievancesWidget() {
    const tbody = document.getElementById('grievancesWidgetBody');
    const emptyEl = document.getElementById('grvWidgetEmpty');
    const tableEl = document.getElementById('grievancesTable');
    if (!tbody) return; // guard if element missing

    try {
        const res = await LgaConnection.apiFetch('/api/grievances');
        let grievances = await res.json();

        // Filter by current LGA context (LGA Admins see only their LGA)
        if (currentContextLga && currentContextLga !== 'System-wide') {
            grievances = grievances.filter(g => g.lga === currentContextLga);
        }

        // Sort: High priority first, then newest first
        const pOrder = { High: 0, Medium: 1, Low: 2 };
        grievances.sort((a, b) => {
            if (pOrder[a.priority] !== pOrder[b.priority]) return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
            return new Date(b.submittedAt) - new Date(a.submittedAt);
        });

        // Update summary counts
        const pending = grievances.filter(g => g.status === 'Pending').length;
        const review = grievances.filter(g => g.status === 'Under Review').length;
        const active = grievances.filter(g => g.status !== 'Resolved' && g.status !== 'Rejected').length;

        document.getElementById('grvWidgetCount').textContent = active;
        document.getElementById('grvWidgetPending').textContent = pending + ' pending';
        document.getElementById('grvWidgetReview').textContent = review + ' under review';

        // Show only non-resolved (active) grievances, max 10
        const activeGrievances = grievances.filter(g => g.status !== 'Resolved' && g.status !== 'Rejected').slice(0, 10);

        if (activeGrievances.length === 0) {
            tableEl.style.display = 'none';
            emptyEl.style.display = 'block';
            feather.replace();
            return;
        }

        tableEl.style.display = '';
        emptyEl.style.display = 'none';

        tbody.innerHTML = activeGrievances.map(g => {
            const statusMap = {
                'Pending': { cls: 'status-pending', label: 'Pending' },
                'Under Review': { cls: 'status-partial', label: 'Under Review' },
                'Resolved': { cls: 'status-completed', label: 'Resolved' },
                'Rejected': { cls: 'status-overdue', label: 'Rejected' }
            };
            const st = statusMap[g.status] || statusMap['Pending'];

            const priorityStyles = {
                Low: 'background:#ecfdf5;color:#059669;',
                Medium: 'background:#fffbeb;color:#d97706;',
                High: 'background:#fef2f2;color:#dc2626;'
            };
            const pStyle = priorityStyles[g.priority] || '';

            const date = new Date(g.submittedAt).toLocaleDateString('en-NG', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            return `<tr>
                <td><strong style="font-size:0.75rem;letter-spacing:0.03em;color:var(--primary);">${g.ref || '—'}</strong></td>
                <td>
                    <div style="font-weight:600;font-size:0.8125rem;">${g.name}</div>
                    <div style="font-size:0.7rem;color:var(--slate-400);">${g.phone || ''}</div>
                </td>
                <td style="font-size:0.8125rem;">${g.lga}</td>
                <td style="font-size:0.8125rem;max-width:160px;">
                    <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${g.category}">${g.category}</div>
                </td>
                <td>
                    <span style="display:inline-block;padding:0.2rem 0.625rem;border-radius:99px;font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;${pStyle}">${g.priority}</span>
                </td>
                <td><span class="status-badge ${st.cls}">${st.label}</span></td>
                <td style="font-size:0.8125rem;color:var(--slate-500);white-space:nowrap;">${date}</td>
                <td>
                    <a href="grievances-admin.html" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.3rem 0.625rem;border-radius:0.5rem;background:#eef2ff;color:#4f46e5;font-size:0.75rem;font-weight:600;text-decoration:none;transition:all 0.2s;">
                        <i data-feather="eye" style="width:12px;height:12px;"></i> Respond
                    </a>
                </td>
            </tr>`;
        }).join('');

        feather.replace();
    } catch (err) {
        console.error('[Grievances Widget] Error:', err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--slate-400);font-size:0.8125rem;">Could not load grievances. Server may be offline.</td></tr>';
    }
}

// Load grievances widget on page load
loadGrievancesWidget();
