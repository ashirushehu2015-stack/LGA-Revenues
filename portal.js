// Tax Categories State (Fetched from server)
let taxCategories = [];

async function fetchTaxRates() {
    try {
        const res = await LgaConnection.apiFetch('/api/tax-rates');
        taxCategories = await res.json();
        renderTaxSelector();
    } catch (e) {
        console.error('Portal: Could not fetch tax rates');
    }
}
fetchTaxRates();

function toggleValuationField() {
    const valuationGroup = document.getElementById('valuationGroup');
    const selectedLabels = Array.from(taxSelector.querySelectorAll('.tax-item-check.selected input'));
    
    const needsValuation = selectedLabels.some(input => {
        const tax = JSON.parse(input.dataset.tax);
        const rate = tax.urban; // Portal uses urban as default for self-service
        return rate && (typeof rate === 'string') && (rate.includes('%') || rate.toLowerCase().includes('value'));
    });
    
    valuationGroup.style.display = needsValuation ? 'block' : 'none';
}

// State
let currentPayer = JSON.parse(localStorage.getItem('lga_portal_payer'));
let serverSettings = { paystackPublicKey: '', paystackMode: 'test' };

async function fetchSettings() {
    try {
        const res = await LgaConnection.apiFetch('/api/settings');
        serverSettings = await res.json();
    } catch (e) {
        console.warn('Portal: Could not fetch server settings');
    }
}

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const taxSelector = document.getElementById('portalTaxSelector');
const taxSearchInput = document.getElementById('taxSearchInput');
const selectedTaxesSummary = document.getElementById('selectedTaxesSummary');
const portalLogoutBtn = document.getElementById('portalLogoutBtn');

// Initialize Feather Icons
feather.replace();

// --- Quick Access Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    await fetchSettings();
    
    if (currentPayer) {
        showDashboard();
        return;
    }

    const quickId = localStorage.getItem('quick_access_payer_id');
    if (quickId) {
        localStorage.removeItem('quick_access_payer_id'); // Clear it
        const loginInput = document.getElementById('loginIdentifier');
        if (loginInput) {
            loginInput.value = quickId;
            // Trigger login
            const loginForm = document.getElementById('payerLoginForm');
            if (loginForm) {
                const event = new Event('submit', { cancelable: true });
                loginForm.dispatchEvent(event);
            }
        }
    }
});

// --- Auth Tab Switching ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabViews = document.querySelectorAll('.tab-view');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabViews.forEach(v => v.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}View`).classList.add('active');
    });
});

// --- Tax Selection Logic ---
let selectedTaxes = new Set();

function renderTaxSelector(filter = '') {
    if (!taxSelector) return;
    taxSelector.innerHTML = '';
    
    const searchTerm = filter.toLowerCase();
    let matchCount = 0;

    taxCategories.forEach(cat => {
        cat.taxes.forEach(tax => {
            if (tax.name.toLowerCase().includes(searchTerm) || cat.categoryName.toLowerCase().includes(searchTerm)) {
                matchCount++;
                const isSelected = selectedTaxes.has(tax.name);
                const label = document.createElement('label');
                label.className = `tax-item-check ${isSelected ? 'selected' : ''}`;
                label.innerHTML = `
                    <input type="checkbox" name="taxes" value="${tax.name}" ${isSelected ? 'checked' : ''} data-tax='${JSON.stringify(tax)}'>
                    <div class="tax-item-info">
                        <span class="tax-item-name">${tax.name}</span>
                        <span class="tax-item-cat">${cat.categoryName}</span>
                    </div>
                `;
                
                label.querySelector('input').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedTaxes.add(tax.name);
                        label.classList.add('selected');
                    } else {
                        selectedTaxes.delete(tax.name);
                        label.classList.remove('selected');
                    }
                    updateSelectedSummary();
                    toggleValuationField();
                });
                
                taxSelector.appendChild(label);
            }
        });
    });

    if (matchCount === 0) {
        taxSelector.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 2rem; color: var(--slate-400);">No taxes found matching your search.</div>';
    }
}

function updateSelectedSummary() {
    if (selectedTaxes.size === 0) {
        selectedTaxesSummary.innerHTML = '<span>No taxes selected</span>';
    } else {
        selectedTaxesSummary.innerHTML = `<span>${selectedTaxes.size} Tax Item(s) Selected</span>`;
    }
}

if (taxSearchInput) {
    taxSearchInput.addEventListener('input', (e) => renderTaxSelector(e.target.value));
}

// Initial render
renderTaxSelector();

// --- Registration Logic ---
const registerForm = document.getElementById('payerRegisterForm');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedTaxes.size === 0) {
        alert('Please select at least one tax category.');
        return;
    }

    const assessmentValue = parseFloat(document.getElementById('regAssessmentValue').value) || 0;

    // Collect full data for selected taxes
    const finalTaxes = [];
    taxCategories.forEach(cat => {
        cat.taxes.forEach(tax => {
            if (selectedTaxes.has(tax.name)) {
                // Get amount based on LGA classification (defaulting to urban for public portal)
                let rawRate = tax.urban;
                let parsedAmount = 0;
                let rateType = 'Flat';

                if (rawRate && (typeof rawRate === 'string') && (rawRate.includes('%') || rawRate.toLowerCase().includes('value'))) {
                    rateType = 'Percentage';
                    const pctMatch = rawRate.match(/([0-9.]+)%/);
                    if (pctMatch && assessmentValue > 0) {
                        const pct = parseFloat(pctMatch[1]);
                        parsedAmount = Math.round((pct / 100) * assessmentValue);
                    }
                } else if (typeof rawRate === 'number') {
                    parsedAmount = rawRate;
                } else if (typeof rawRate === 'string') {
                    const numericValue = parseFloat(rawRate.replace(/[^0-9.]/g, ''));
                    parsedAmount = isNaN(numericValue) ? 0 : numericValue;
                    rateType = isNaN(numericValue) ? (rawRate || 'Variable') : 'Flat';
                }

                finalTaxes.push({
                    id: 'tax-' + Math.random().toString(36).substring(2, 9),
                    name: tax.name,
                    amount: parsedAmount,
                    rateType: rateType,
                    assessmentValue: rateType === 'Percentage' ? assessmentValue : null,
                    duration: tax.duration,
                    status: 'Pending'
                });
            }
        });
    });

    const newPayer = {
        id: Date.now().toString(),
        businessName: document.getElementById('regBusinessName').value,
        businessAddress: document.getElementById('regBusinessAddress').value,
        lga: document.getElementById('regLga').value,
        lineOfBusiness: document.getElementById('regLineOfBusiness').value,
        contactPerson: document.getElementById('regContactPerson').value,
        addressCp: document.getElementById('regAddressCp').value,
        phoneNumber: document.getElementById('regPhoneNumber').value,
        password: document.getElementById('regPassword').value,
        status: 'Active',
        origin: 'Portal',
        taxes: finalTaxes
    };

    try {
        const res = await LgaConnection.apiFetch('/api/revenues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPayer)
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Registration Successful! Your Invoice Reference is: ' + (data.added_ref || 'Available in portal.'));
            currentPayer = newPayer;
            currentPayer.invoiceRef = data.added_ref;
            localStorage.setItem('lga_portal_payer', JSON.stringify(currentPayer));
            showDashboard();
        } else {
            alert('Registration failed: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        document.getElementById('connectionTroubleshoot').style.display = 'block';
        alert('Server error during registration. Is the server running?');
    }
});

// --- Login Logic ---
const loginForm = document.getElementById('payerLoginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const res = await LgaConnection.apiFetch('/api/revenues'); 
        const allPayers = await res.json();
        
        const payer = allPayers.find(p => p.phoneNumber === identifier || p.invoiceRef === identifier);
        
        if (payer) {
            // Verification logic:
            // 1. If record has a 'password' field, it must match.
            // 2. If it doesn't have a 'password' field (legacy), fallback to 'phoneNumber' as password.
            const storedPassword = payer.password || payer.phoneNumber;
            
            if (password === storedPassword) {
                currentPayer = payer;
                localStorage.setItem('lga_portal_payer', JSON.stringify(currentPayer));
                showDashboard();
            } else {
                document.getElementById('loginError').textContent = 'Invalid password. Please try again or contact support.';
                document.getElementById('loginError').style.display = 'block';
            }
        } else {
            document.getElementById('loginError').textContent = 'Payer record not found. Please register your business.';
            document.getElementById('loginError').style.display = 'block';
        }
    } catch (err) {
        document.getElementById('connectionTroubleshoot').style.display = 'block';
    }
});

// --- Dashboard Logic ---
function showDashboard() {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    portalLogoutBtn.style.display = 'block';
    
    document.getElementById('dashBusinessName').textContent = currentPayer.businessName;
    document.getElementById('dashOwnerName').textContent = currentPayer.contactPerson || 'Business Owner';
    document.getElementById('dashPayerRef').textContent = currentPayer.invoiceRef || 'Pending Ref';
    document.getElementById('dashLga').textContent = `${currentPayer.lga} LGA`;
    
    renderPayerTaxes();
}

function renderPayerTaxes() {
    const list = document.getElementById('dashTaxList');
    list.innerHTML = '';
    
    let unpaid = 0;
    let paid = 0;
    
    (currentPayer.taxes || []).forEach(tax => {
        if (tax.status === 'Paid') paid += tax.amount;
        else unpaid += tax.amount;
        
        const isVariable = tax.rateType === 'Variable' && tax.amount === 0;
        const amountDisplay = isVariable ? 'Variable' : `₦${tax.amount.toLocaleString()}`;

        const item = document.createElement('div');
        item.className = 'tax-portal-item';
        item.innerHTML = `
            <div class="tax-info-group">
                <h4>${tax.name}</h4>
                <p>Cycle: ${tax.duration} | Status: <span class="status-badge status-${tax.status.toLowerCase()}">${tax.status}</span></p>
            </div>
            <div class="tax-actions">
                <span class="tax-amount">${amountDisplay}</span>
                ${tax.status !== 'Paid' ? 
                    `<button class="btn btn-primary btn-sm" onclick="payTax('${tax.id}')">Pay Online</button>` : 
                    `<button class="btn btn-outline btn-sm" onclick="downloadReceipt('${tax.id}')"><i data-feather="download"></i></button>`
                }
            </div>
        `;
        list.appendChild(item);
    });
    
    document.getElementById('dashUnpaidBalance').textContent = `₦${unpaid.toLocaleString()}`;
    document.getElementById('dashTotalPaid').textContent = `₦${paid.toLocaleString()}`;
    feather.replace();
}

window.payTax = function(taxId) {
    const tax = currentPayer.taxes.find(t => t.id === taxId);
    if (!tax) return;
    
    let amountToPay = tax.amount;

    // Handle variable amounts or zero amounts with a prompt (Self-Assessment)
    if (amountToPay <= 0) {
        const userInput = prompt(`Enter the amount to pay for ${tax.name} (in Naira):`, "1000");
        if (userInput === null) return; // Cancelled
        amountToPay = parseFloat(userInput);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
    }

    const amountKobo = amountToPay * 100;

    const handler = PaystackPop.setup({
        key: serverSettings.paystackPublicKey || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        email: currentPayer.phoneNumber + '@lgarevmax.gov.ng', // Fallback email
        amount: amountKobo,
        currency: 'NGN',
        callback: function(response) {
            verifyPayment(response.reference, taxId, amountToPay);
        }
    });
    handler.openIframe();
};

async function verifyPayment(ref, taxId, amount) {
    const res = await LgaConnection.apiFetch(`/api/payments/verify/${ref}?id=${currentPayer.id}&taxId=${taxId}&amount=${amount}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        alert('Payment Successful!');
        location.reload(); // Refresh to update dashboard
    }
}

// --- Report / Receipt Logic ---
const reportModal = document.getElementById('reportModal');
const reportModalBody = document.getElementById('reportModalBody');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const printReportBtn = document.getElementById('printReportBtn');
const closeReportBtn = document.querySelector('.close-modal');

window.downloadReceipt = function(taxId) {
    const tax = currentPayer.taxes.find(t => t.id === taxId);
    if (!tax) return;
    
    reportModalBody.innerHTML = generateReceiptHTML(currentPayer, tax);
    reportModal.classList.add('active');
    feather.replace();
};

function generateReceiptHTML(payer, tax) {
    const dateStr = new Date(tax.paymentDate || Date.now()).toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric' 
    });
    
    const timeStr = new Date(tax.paymentDate || Date.now()).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit'
    });

    const lgaHeader = `${(payer.lga || 'ZAMFARA').toUpperCase()} LGA`;
    const amount = tax.amountPaid || tax.amount;

    return `
        <div class="receipt-container" id="receiptContent">
            <div class="receipt-header">
                <div class="header-main">
                    <img src="logo.png" alt="Logo" class="receipt-logo">
                    <div class="government-info">
                        <h2>ZAMFARA STATE GOVERNMENT</h2>
                        <h3>LOCAL GOVERNMENT REVENUE SERVICE</h3>
                        <p>${lgaHeader} ADMINISTRATION</p>
                    </div>
                    <div class="receipt-badge">OFFICIAL RECEIPT</div>
                </div>
            </div>

            <div class="receipt-body">
                <div class="success-banner">
                    <div class="check-icon">✓</div>
                    <div class="payment-confirmed">
                        <h4>PAYMENT CONFIRMED</h4>
                        <p>Ref: ${tax.paymentReference || 'N/A'}</p>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <label>PAYER NAME</label>
                        <p>${payer.contactPerson}</p>
                    </div>
                    <div class="info-item">
                        <label>BUSINESS NAME</label>
                        <p>${payer.businessName}</p>
                    </div>
                    <div class="info-item">
                        <label>PAYER REFERENCE</label>
                        <p>${payer.invoiceRef}</p>
                    </div>
                    <div class="info-item">
                        <label>PHONE NUMBER</label>
                        <p>${payer.phoneNumber}</p>
                    </div>
                </div>

                <div class="payment-details">
                    <table>
                        <thead>
                            <tr>
                                <th>TAX DESCRIPTION</th>
                                <th>CYCLE</th>
                                <th class="text-right">AMOUNT PAID</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="tax-name">${tax.name}</span>
                                    <span class="tax-desc">Revenue Item</span>
                                </td>
                                <td>${tax.duration}</td>
                                <td class="text-right amount">₦${amount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2">TOTAL PAID</td>
                                <td class="text-right total">₦${amount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="payment-meta">
                    <div class="meta-item">
                        <label>DATE PAID</label>
                        <p>${dateStr}</p>
                    </div>
                    <div class="meta-item">
                        <label>TIME</label>
                        <p>${timeStr}</p>
                    </div>
                    <div class="meta-item">
                        <label>METHOD</label>
                        <p>Digital (Paystack)</p>
                    </div>
                </div>
            </div>

            <div class="receipt-footer">
                <div class="footer-notice">
                    <p>This is a computer-generated receipt and requires no signature.</p>
                    <p>Thank you for supporting the development of ${payer.lga} LGA.</p>
                </div>
                <div class="qr-placeholder">
                    <div class="qr-code"></div>
                    <span>VERIFIED</span>
                </div>
            </div>
        </div>
    `;
}

// Modal actions
if (printReportBtn) {
    printReportBtn.addEventListener('click', () => window.print());
}

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('receiptContent');
        const opt = {
            margin:       0.2,
            filename:     `Receipt_${currentPayer.invoiceRef.replace(/\//g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
}

if (closeReportBtn) {
    closeReportBtn.addEventListener('click', () => reportModal.classList.remove('active'));
}

reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) reportModal.classList.remove('active');
});

portalLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('lga_portal_payer');
    location.reload();
});

// Portal Status Indicator
const statusPill = document.getElementById('serverStatusPill');
if (statusPill) {
    const statusText = statusPill.querySelector('span');
    const troubleshoot = document.getElementById('connectionTroubleshoot');
    LgaConnection.onStatusChange((status) => {
        statusPill.className = `connection-pill ${status}`;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        
        if (status === 'online' && troubleshoot) {
            troubleshoot.style.display = 'none';
        } else if (status === 'offline' && troubleshoot) {
            troubleshoot.style.display = 'block';
        }
    });
}
