// --- Multilingual Localized Translations Engine (English & Hausa) ---
const translations = {
    en: {
        nav_checking: "Checking...",
        nav_logout: "Log Out",
        nav_home: "Home",
        nav_lang_label: "Language:",
        lang_banner_text: "<strong style='color:#e9d5ff;'>Hausa speakers:</strong> You can switch this portal to Hausa at any time using the <strong style='color:#e9d5ff;'>Language selector</strong> in the top right corner of this page.",
        tab_login: "Login",
        tab_register: "Register Business",
        login_welcome: "Welcome Back",
        login_desc: "Enter your Phone Number or Invoice Reference to access your portal.",
        login_id_label: "Phone Number or Invoice Ref",
        login_id_placeholder: "e.g. 08012345678 or LGA/REV/...",
        login_pass_label: "Access Password",
        login_pass_placeholder: "Enter your portal password",
        login_pass_hint: "First time? Your initial password is your Phone Number.",
        login_btn: "Access Portal",
        connection_issue_title: "Connection Issue",
        connection_issue_desc: "The system backend is unreachable. Please ensure the server is running or contact support.",
        reg_title: "Business Registration",
        reg_desc: "Register your business with the Local Government Area for revenue assessment.",
        reg_business_name: "Business Name",
        reg_business_name_placeholder: "Enter your business name",
        reg_business_address: "Business Address",
        reg_business_address_placeholder: "Enter business location",
        reg_lga: "LGA",
        reg_lga_select: "Select LGA",
        reg_line_of_business: "Line of Business",
        reg_line_of_business_placeholder: "e.g. Retail, Construction",
        reg_contact_person: "Contact Person Name",
        reg_contact_person_placeholder: "Full name",
        reg_phone_number: "Phone Number",
        reg_phone_number_placeholder: "Phone number",
        reg_password: "Create Portal Password",
        reg_password_placeholder: "Min 6 characters",
        reg_assessment_value: "Estimated Property / Asset Value (₦)",
        reg_assessment_value_placeholder: "Enter estimated value for percentage-based taxes (e.g. Tenement Rates)",
        reg_valuation_hint: "For businesses subject to percentage-based rates (like Tenement Rates), please provide an estimated value for faster assessment.",
        reg_personal_address: "Personal Address (Contact Person)",
        reg_personal_address_placeholder: "Enter your home/office address",
        reg_tax_categories: "Assigned Tax Categories",
        reg_tax_search_placeholder: "Search taxes (e.g. Tenement, Shop, License)...",
        reg_no_taxes: "No taxes selected",
        reg_submit_btn: "Create Payer Account",
        dash_welcome: "Welcome back,",
        dash_need_assistance: "Need Assistance?",
        dash_assistance_desc: "Disputed assessments, payment issues, or general complaints can be filed directly through our official redressing system.",
        dash_dispute_btn: "Dispute Tax / File Grievance",
        dash_unpaid_label: "Unpaid Balance",
        dash_total_paid_label: "Total Paid",
        dash_assigned_taxes: "Assigned Taxes & Assessments",
        dash_assigned_desc: "Select an item to pay online or download the assessment notice.",
        dash_recent_activity: "Recent Activity",
        checkout_title: "Choose Payment Method",
        pay_online_title: "Pay Online",
        pay_online_desc: "Instant verification via Card/USSD/Bank",
        bank_transfer_title: "Bank Transfer",
        bank_transfer_desc: "Direct manual mobile transfer",
        bank_teller_title: "Bank Teller",
        bank_teller_desc: "Branch cash deposit upload",
        cash_counter_title: "LGA Cash Counter",
        cash_counter_desc: "Cash payment at LGA Office",
        panel_paystack_title: "Paystack Secure Payment",
        panel_paystack_desc: "You will be redirected to the secure Paystack gateway to make your payment instantly. Once paid, your digital receipt will be automatically generated.",
        panel_paystack_btn: "Proceed to Pay Online",
        panel_transfer_title: "Direct Bank Transfer",
        bank_name_label: "Bank Name",
        bank_acc_name_label: "Account Name",
        bank_acc_num_label: "Account Number",
        panel_transfer_desc: "Perform a bank transfer of the exact tax amount to the details above. Then, input your transfer details below for confirmation.",
        transfer_ref_label: "Transfer Ref / Transaction Session ID",
        transfer_ref_placeholder: "e.g. TX-12938473849929",
        transfer_depositor_label: "Sender Account Name",
        transfer_depositor_placeholder: "e.g. Bashir Sani",
        transfer_submit_btn: "Submit Transfer for Audit",
        panel_teller_title: "Branch Cash Deposit",
        panel_teller_desc: "Deposit cash into the official bank account above, and submit your paper teller details below.",
        teller_num_label: "Teller Stamp / Serial Number",
        teller_num_placeholder: "e.g. TL-8839201",
        teller_depositor_label: "Depositor Name",
        teller_depositor_placeholder: "e.g. Sani & Sons Ltd",
        teller_submit_btn: "Submit Teller for Audit",
        panel_cash_title: "Cash at Counter",
        panel_cash_desc: "Please visit your Local Government Secretariat's Revenue Office. Mention your unique Invoice Reference / Business Name at the counter to pay cash directly.",
        nearest_center_label: "Nearest Collection Center",
        cash_hours_label: "Hours: Mon – Fri, 8:00 AM – 4:00 PM WAT",
        cash_close_btn: "Got it, close checkout",
        receipt_title: "Tax Document",
        receipt_print_btn: "Print",
        receipt_pdf_btn: "PDF",
        dash_compliance_tier: "Compliance Rating",
        dash_compliance_feedback: "Your tax contributions fund local development projects such as schools, clean water, and roads in your LGA."
    },
    ha: {
        nav_checking: "Ana duba...",
        nav_logout: "Fita",
        nav_home: "Gida",
        nav_lang_label: "Harshe:",
        lang_banner_text: "<strong style='color:#e9d5ff;'>Domin Harshen Hausa:</strong> Kuna iya sauya harshen shafin zuwa Hausa a kowane lokaci ta amfani da <strong style='color:#e9d5ff;'>Za&#x253;in Harshe</strong> a kusurwar dama ta sama.",
        tab_login: "Shiga",
        tab_register: "Rijistar Kasuwanci",
        login_welcome: "Barka da Dawowa",
        login_desc: "Shigar da Lambar Waya ko Hujjar Invoice don shiga shafinka.",
        login_id_label: "Lambar Waya ko Hujjar Invoice",
        login_id_placeholder: "Kamar 08012345678 ko LGA/REV/...",
        login_pass_label: "Kalmar Sirri ta Shiga",
        login_pass_placeholder: "Shigar da kalmar sirrinka ta portal",
        login_pass_hint: "Karon farko ne? Kalmar sirrinka ta farko ita ce lambar wayarka.",
        login_btn: "Shiga Shafin",
        connection_issue_title: "Matsalar Haɗi",
        connection_issue_desc: "Ba za a iya samun uwar garke ba. Tabbatar cewa uwar garken tana aiki ko tuntuɓi sashen taimako.",
        reg_title: "Rijistar Kasuwanci",
        reg_desc: "Yi wa kasuwancinka rijista da Karamar Hukumar don tantance haraji.",
        reg_business_name: "Sunan Kasuwanci",
        reg_business_name_placeholder: "Shigar da sunan kasuwancinka",
        reg_business_address: "Adireshin Kasuwanci",
        reg_business_address_placeholder: "Shigar da adireshin kasuwanci",
        reg_lga: "Karamar Hukuma",
        reg_lga_select: "Zaɓi Karamar Hukuma",
        reg_line_of_business: "Nau'in Kasuwanci",
        reg_line_of_business_placeholder: "Kamar Shago, Kasuwanci, gini",
        reg_contact_person: "Sunan Wakili",
        reg_contact_person_placeholder: "Cikakken Suna",
        reg_phone_number: "Lambar Waya",
        reg_phone_number_placeholder: "Lambar waya",
        reg_password: "Ƙirƙiri Kalmar Sirri ta Portal",
        reg_password_placeholder: "Aƙalla haruffa 6",
        reg_assessment_value: "Kiyasin Darajar Dukiya / Kaya (₦)",
        reg_assessment_value_placeholder: "Shigar da kiyasin darajar kuɗi don harajin kashi gida (misali Tenement Rates)",
        reg_valuation_hint: "Don kasuwanci da ke ƙarƙashin harajin kashi dari (kamar kuɗin gida), da fatan za a bayar da kiyasin darajar kaya don sauƙaƙa tantancewa.",
        reg_personal_address: "Adireshin Gida (Wakili)",
        reg_personal_address_placeholder: "Shigar da adireshin gidanka ko na ofis",
        reg_tax_categories: "Rukunin Haraji da Aka Ware",
        reg_tax_search_placeholder: "Nemi haraji (kamar Shago, Kuɗin Gida, Lasisi)...",
        reg_no_taxes: "Ba a zaɓi kowane haraji ba",
        reg_submit_btn: "Ƙirƙiri Asusun Mai Biyan Haraji",
        dash_welcome: "Barka da dawowa,",
        dash_need_assistance: "Kuna Bukatar Taimako?",
        dash_assistance_desc: "Ana iya shigar da korafe-korafe game da haraji, matsalolin biya, ko wasu korafe-korafe kai tsaye ta hanyar tsarinmu na hukuma.",
        dash_dispute_btn: "Nuna Rashin Yarda / Shigar da Ƙorafi",
        dash_unpaid_label: "Sauran Kuɗi",
        dash_total_paid_label: "Jimillar Kuɗin da Aka Biya",
        dash_assigned_taxes: "Ayyukan Haraji da Aka Ware",
        dash_assigned_desc: "Zaɓi abu ɗaya don biya a kan layi ko zazzage takardar sanarwar haraji.",
        dash_recent_activity: "Ayyukan Kwanan Nan",
        checkout_title: "Zaɓi Hanyar Biya",
        pay_online_title: "Biya a Kan Layi",
        pay_online_desc: "Tabbatarwa take ta Katin banki/USSD/Banki",
        bank_transfer_title: "Canja wurin Banki",
        bank_transfer_desc: "Canja kuɗi ta wayar tarho kai tsaye",
        bank_teller_title: "Bank Teller",
        bank_teller_desc: "Tura hoton takardar banki",
        cash_counter_title: "Ofishin Karamar Hukuma",
        cash_counter_desc: "Biyan kuɗi na hannu a ofishin Karamar Hukuma",
        panel_paystack_title: "Amintaccen Biyan Kuɗi na Paystack",
        panel_paystack_desc: "Za a tura ku zuwa amintaccen shafin Paystack don yin biyan kuɗi nan take. Bayan kun biya, za a ƙirƙiri takardar biyan kuɗi ta dijital ta atomatik.",
        panel_paystack_btn: "Ci gaba da Biyan Kuɗi a Kan Layi",
        panel_transfer_title: "Canja kuɗi ta Banki Kai tsaye",
        bank_name_label: "Sunan Banki",
        bank_acc_name_label: "Sunan Asusu",
        bank_acc_num_label: "Lambar Asusu",
        panel_transfer_desc: "Aika canja wurin banki na ainihin adadin harajin zuwa bayanan da ke sama. Sannan shigar da bayanan aikawar ku a ƙasa don tabbatarwa.",
        transfer_ref_label: "Lambar Hujja ta Tura Kuɗi / ID na Zama",
        transfer_ref_placeholder: "Kamar TX-12938473849929",
        transfer_depositor_label: "Sunan Mai Aika Kuɗin",
        transfer_depositor_placeholder: "Kamar Bashir Sani",
        transfer_submit_btn: "Tura Canja wurin Kuɗi don Bincike",
        panel_teller_title: "Ajiye Kuɗi a Ofishin Banki",
        panel_teller_desc: "Sanya tsabar kuɗi a cikin asusun banki na hukuma da ke sama, sannan ka shigar da bayanan takardar ajiye kuɗinka na takarda a ƙasa.",
        teller_num_label: "Tambarin Takarda / Lambar Serial",
        teller_num_placeholder: "Kamar TL-8839201",
        teller_depositor_label: "Sunan Mai Ajiye Kuɗin",
        teller_depositor_placeholder: "Kamar Sani & Sons Ltd",
        teller_submit_btn: "Tura Takardar don Bincike",
        panel_cash_title: "Kuɗi a Kanti",
        panel_cash_desc: "Da fatan za a ziyarci Ofishin Haraji na Sakatariyar Karamar Hukumar ku. Ambaci lambar Hujjar Invoice / Sunan Kasuwanci na musamman a wurin biyan kuɗi don biya da tsabar kuɗi kai tsaye.",
        nearest_center_label: "Cibiyar Karɓa Mafi Kusa",
        cash_hours_label: "Lokaci: Lit – Jum, 8:00 na safe – 4:00 na yamma WAT",
        cash_close_btn: "Na gane, rufe wurin biya",
        receipt_title: "Takardar Haraji",
        receipt_print_btn: "Buga",
        receipt_pdf_btn: "PDF",
        dash_compliance_tier: "Kiyasin Biyayya",
        dash_compliance_feedback: "Kuɗin harajinku suna tallafawa ayyukan ci gaban yankin ku kamar makarantu, ruwan sha, da hanyoyi a Karamar Hukumar ku."
    }
};

let currentLang = localStorage.getItem('lga_lang') || 'en';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lga_lang', lang);
    
    // Synchronize selector value
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    // Update switcher label text
    const langLabel = document.getElementById('langLabel');
    if (langLabel) langLabel.textContent = lang === 'ha' ? 'Hausa' : 'English';

    // Translate all standard text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key] !== undefined) {
            const value = translations[lang][key];
            // Check if there are any child element nodes to preserve (like icon <i> tags)
            const icon = el.querySelector('i');
            if (icon) {
                // If it contains a child icon, preserve the icon and append translated text
                el.innerHTML = '';
                el.appendChild(icon);
                el.appendChild(document.createTextNode(' ' + value));
            } else if (value.includes('<')) {
                // Contains HTML markup (e.g. <strong>), use innerHTML safely
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        }
    });

    // Translate all placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key] !== undefined) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // Re-render language-dependent items in state if any
    updateSelectedSummary();
    if (currentPayer) {
        // Redraw welcome headers, info labels, etc
        document.getElementById('dashBusinessName').textContent = currentPayer.businessName;
        document.getElementById('dashOwnerName').textContent = currentPayer.contactPerson || (currentLang === 'ha' ? 'Wakili' : 'Business Owner');
        document.getElementById('dashPayerRef').textContent = currentPayer.invoiceRef || (currentLang === 'ha' ? 'Hujja tana nan tafe' : 'Pending Ref');
        const lgaText = currentLang === 'ha' ? `Karamar Hukumar ${currentPayer.lga}` : `${currentPayer.lga} LGA`;
        document.getElementById('dashLga').textContent = lgaText;
        renderPayerTaxes();
    }
}

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
    // Bind language select event listener
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    
    // Set initial language
    setLanguage(currentLang);
    
    await fetchSettings();
    
    if (currentPayer) {
        showDashboard();
        syncPayerProfile();
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
        const noTaxesMsg = currentLang === 'ha' ? 'Ba a sami harajin da ya dace da bincikenka ba.' : 'No taxes found matching your search.';
        taxSelector.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 2rem; color: var(--slate-400);">${noTaxesMsg}</div>`;
    }
}

function updateSelectedSummary() {
    if (!selectedTaxesSummary) return;
    if (selectedTaxes.size === 0) {
        selectedTaxesSummary.innerHTML = `<span data-i18n="reg_no_taxes">${currentLang === 'ha' ? 'Ba a zaɓi kowane haraji ba' : 'No taxes selected'}</span>`;
    } else {
        const text = currentLang === 'ha' ? `Rukunin Haraji ${selectedTaxes.size} da aka Zaɓa` : `${selectedTaxes.size} Tax Item(s) Selected`;
        selectedTaxesSummary.innerHTML = `<span>${text}</span>`;
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
        const msg = currentLang === 'ha' ? 'Da fatan za a zaɓi aƙalla rukunin haraji guda ɗaya.' : 'Please select at least one tax category.';
        alert(msg);
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
            const successMsg = currentLang === 'ha' ? 'Rijista ta yi nasara! Lambar Hujjarku ita ce: ' : 'Registration Successful! Your Invoice Reference is: ';
            alert(successMsg + (data.added_ref || 'Available in portal.'));
            currentPayer = newPayer;
            currentPayer.invoiceRef = data.added_ref;
            localStorage.setItem('lga_portal_payer', JSON.stringify(currentPayer));
            showDashboard();
        } else {
            const failMsg = currentLang === 'ha' ? 'Rijista ta gaza: ' : 'Registration failed: ';
            alert(failMsg + data.message);
        }
    } catch (err) {
        console.error(err);
        document.getElementById('connectionTroubleshoot').style.display = 'block';
        const serverErrorMsg = currentLang === 'ha' ? 'Kuskuren uwar garke lokacin rijista. Shin uwar garken tana aiki?' : 'Server error during registration. Is the server running?';
        alert(serverErrorMsg);
    }
});

// --- Login Logic ---
const loginForm = document.getElementById('payerLoginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');
    
    if (loginError) loginError.style.display = 'none';

    try {
        const res = await LgaConnection.apiFetch('/api/payer/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            currentPayer = data.payer;
            localStorage.setItem('lga_portal_payer', JSON.stringify(currentPayer));
            localStorage.setItem('lga_jwt_token', data.token);
            showDashboard();
            syncPayerProfile(); // Trigger immediate sync
        } else {
            if (loginError) {
                loginError.textContent = data.message || (currentLang === 'ha' ? 'Bayanan shiga ba daidai ba ne. Da fatan za a sake gwadawa.' : 'Invalid credentials. Please try again.');
                loginError.style.display = 'block';
            }
        }
    } catch (err) {
        document.getElementById('connectionTroubleshoot').style.display = 'block';
        if (loginError) {
            loginError.textContent = currentLang === 'ha' ? 'Kuskuren haɗi. Tabbatar cewa uwar garken tana aiki.' : 'Connection error. Please ensure server is running.';
            loginError.style.display = 'block';
        }
    }
});

// --- Dashboard Logic ---
function showDashboard() {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    portalLogoutBtn.style.display = 'block';
    
    document.getElementById('dashBusinessName').textContent = currentPayer.businessName;
    document.getElementById('dashOwnerName').textContent = currentPayer.contactPerson || (currentLang === 'ha' ? 'Wakili' : 'Business Owner');
    document.getElementById('dashPayerRef').textContent = currentPayer.invoiceRef || (currentLang === 'ha' ? 'Hujja tana nan tafe' : 'Pending Ref');
    const lgaText = currentLang === 'ha' ? `Karamar Hukumar ${currentPayer.lga}` : `${currentPayer.lga} LGA`;
    document.getElementById('dashLga').textContent = lgaText;
    
    renderPayerTaxes();
}

async function syncPayerProfile() {
    if (!currentPayer || !currentPayer.id) return;
    try {
        const res = await LgaConnection.apiFetch(`/api/payer/profile?id=${currentPayer.id}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                currentPayer = data.payer;
                localStorage.setItem('lga_portal_payer', JSON.stringify(currentPayer));
                // Update display values dynamically
                document.getElementById('dashBusinessName').textContent = currentPayer.businessName;
                document.getElementById('dashOwnerName').textContent = currentPayer.contactPerson || (currentLang === 'ha' ? 'Wakili' : 'Business Owner');
                document.getElementById('dashPayerRef').textContent = currentPayer.invoiceRef || (currentLang === 'ha' ? 'Hujja tana nan tafe' : 'Pending Ref');
                const lgaText = currentLang === 'ha' ? `Karamar Hukumar ${currentPayer.lga}` : `${currentPayer.lga} LGA`;
                document.getElementById('dashLga').textContent = lgaText;
                renderPayerTaxes();
            }
        }
    } catch (e) {
        console.warn('Portal: Profile sync failed', e);
    }
}

function renderPayerTaxes() {
    const list = document.getElementById('dashTaxList');
    if (!list) return;
    list.innerHTML = '';
    
    let unpaid = 0;
    let paid = 0;
    
    (currentPayer.taxes || []).forEach(tax => {
        if (tax.status === 'Paid') paid += tax.amount;
        else unpaid += tax.amount;
        
        const isVariable = tax.rateType === 'Variable' && tax.amount === 0;
        const amountDisplay = isVariable ? (currentLang === 'ha' ? 'Ya bambanta' : 'Variable') : `₦${tax.amount.toLocaleString()}`;

        const cycleLabel = currentLang === 'ha' ? 'Zango' : 'Cycle';
        const statusLabel = currentLang === 'ha' ? 'Matsayi' : 'Status';
        let statusText = tax.status;
        if (currentLang === 'ha') {
            if (tax.status === 'Paid') statusText = 'An Biya';
            else if (tax.status === 'Pending') statusText = 'Ana Jira';
        }

        const payOnlineLabel = currentLang === 'ha' ? 'Biya a Kan Layi' : 'Pay Online';

        const item = document.createElement('div');
        item.className = 'tax-portal-item';
        item.innerHTML = `
            <div class="tax-info-group">
                <h4>${tax.name}</h4>
                <p>${cycleLabel}: ${tax.duration} | ${statusLabel}: <span class="status-badge status-${tax.status.toLowerCase()}">${statusText}</span></p>
            </div>
            <div class="tax-actions">
                <span class="tax-amount">${amountDisplay}</span>
                ${tax.status !== 'Paid' ? 
                    `<button class="btn btn-primary btn-sm" onclick="payTax('${tax.id}')">${payOnlineLabel}</button>` : 
                    `<button class="btn btn-outline btn-sm" onclick="downloadReceipt('${tax.id}')"><i data-feather="download"></i></button>`
                }
            </div>
        `;
        list.appendChild(item);
    });
    
    // Calculate compliance percentage
    const totalAssigned = paid + unpaid;
    let compliancePercentage = 0;
    
    if (totalAssigned > 0) {
        compliancePercentage = Math.round((paid / totalAssigned) * 100);
    } else {
        // If no money amount exists (e.g. all taxes are variable / zero-amount pending assessment), 
        // calculate based on count of paid items
        const taxes = currentPayer.taxes || [];
        if (taxes.length > 0) {
            const paidCount = taxes.filter(t => t.status === 'Paid').length;
            compliancePercentage = Math.round((paidCount / taxes.length) * 100);
        } else {
            compliancePercentage = 100; // Perfect compliance by default if no taxes assigned yet
        }
    }

    // Update SVG Circular Progress Ring
    const ringProgress = document.getElementById('complianceRingProgress');
    if (ringProgress) {
        const circumference = 2 * Math.PI * 50; // 314.159
        const dashoffset = circumference - (compliancePercentage / 100) * circumference;
        ringProgress.style.strokeDashoffset = dashoffset;
        
        // Dynamically color ring progress border depending on compliance tier
        if (compliancePercentage === 100) {
            ringProgress.style.stroke = '#10b981'; // Emerald/Green for Gold
        } else if (compliancePercentage >= 50) {
            ringProgress.style.stroke = '#64748b'; // Slate/Silver for Silver
        } else {
            ringProgress.style.stroke = '#f97316'; // Orange/Bronze for Bronze
        }
    }

    // Update Percentage Text
    const percentText = document.getElementById('compliancePercentText');
    if (percentText) {
        percentText.textContent = `${compliancePercentage}%`;
    }

    // Determine Tier Badge
    const badge = document.getElementById('complianceBadge');
    if (badge) {
        badge.className = 'compliance-badge'; // Reset classes
        let tierClass = 'tier-bronze';
        let rankLabel = '';
        let iconName = 'clock';

        if (compliancePercentage === 100) {
            tierClass = 'tier-gold';
            rankLabel = currentLang === 'ha' ? 'Abokin Ci Gaban Jiha' : 'Gold Payer';
            iconName = 'award';
        } else if (compliancePercentage >= 50) {
            tierClass = 'tier-silver';
            rankLabel = currentLang === 'ha' ? 'Abokin Kusa' : 'Silver Payer';
            iconName = 'shield';
        } else {
            tierClass = 'tier-bronze';
            rankLabel = currentLang === 'ha' ? 'Abokin Jira' : 'Bronze Payer';
            iconName = 'clock';
        }

        badge.classList.add(tierClass);
        badge.innerHTML = `<i data-feather="${iconName}"></i> <span id="complianceRankText">${rankLabel}</span>`;
    }
    
    document.getElementById('dashUnpaidBalance').textContent = `₦${unpaid.toLocaleString()}`;
    document.getElementById('dashTotalPaid').textContent = `₦${paid.toLocaleString()}`;
    feather.replace();
}

let activeTaxId = null;
let activeAmountToPay = 0;

// Initialize Checkout Selector Observers
document.addEventListener('DOMContentLoaded', () => {
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
    
    if (checkoutModal) {
        // Tab / Card Switching logic
        const checkoutCards = checkoutModal.querySelectorAll('.checkout-card');
        checkoutCards.forEach(card => {
            card.addEventListener('click', () => {
                checkoutCards.forEach(c => c.classList.remove('active'));
                checkoutModal.querySelectorAll('.checkout-form-panel').forEach(p => p.classList.remove('active'));
                
                card.classList.add('active');
                const method = card.dataset.method;
                const panel = document.getElementById(`panel-${method}`);
                if (panel) panel.classList.add('active');
            });
        });

        // Close Modal events
        const closeAllCheckouts = () => {
            checkoutModal.classList.remove('active');
            activeTaxId = null;
            activeAmountToPay = 0;
            // Clear forms
            document.getElementById('manualTransferForm')?.reset();
            document.getElementById('manualTellerForm')?.reset();
        };

        closeCheckoutBtn?.addEventListener('click', closeAllCheckouts);
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) closeAllCheckouts();
        });

        // Close modal selectors inside panels
        checkoutModal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeAllCheckouts);
        });

        // Paystack Trigger inside checkout modal
        const confirmPaystackBtn = document.getElementById('confirmPaystackBtn');
        confirmPaystackBtn?.addEventListener('click', () => {
            if (!activeTaxId || activeAmountToPay <= 0) return;
            checkoutModal.classList.remove('active');
            triggerPaystackCheckout(activeTaxId, activeAmountToPay);
        });

        // Manual Bank Transfer Submit
        const transferForm = document.getElementById('manualTransferForm');
        transferForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ref = document.getElementById('transferRef').value.trim();
            const depositor = document.getElementById('transferDepositor').value.trim();
            
            if (!ref || !depositor) {
                const msg = currentLang === 'ha' ? 'Da fatan za a cika duk gurare.' : 'Please fill out all fields.';
                alert(msg);
                return;
            }

            try {
                const response = await LgaConnection.apiFetch('/api/payments/submit-manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentPayer.id,
                        taxId: activeTaxId,
                        paymentMethod: 'Bank Transfer',
                        reference: ref,
                        depositorName: depositor,
                        amount: activeAmountToPay
                    })
                });

                const data = await response.json();
                if (data.success) {
                    const successMsg = currentLang === 'ha' ? 'An yi nasarar tura bayanan canja wurin banki! Masu bincikenmu za su tabbatar da wannan ba da jimawa ba.' : 'Manual payment transfer reference submitted successfully! Our auditors will confirm this shortly.';
                    alert(successMsg);
                    location.reload();
                } else {
                    const errorMsg = currentLang === 'ha' ? 'Kuskure yayin tura bayanan: ' : 'Error submitting details: ';
                    alert(`${errorMsg}${data.message}`);
                }
            } catch (err) {
                console.error(err);
                const serverErr = currentLang === 'ha' ? 'Uwar garke ba ta amsa ba. Shin uwar garken tana aiki?' : 'Could not communicate with the server. Is the server running?';
                alert(serverErr);
            }
        });

        // Manual Bank Teller Submit
        const tellerForm = document.getElementById('manualTellerForm');
        tellerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ref = document.getElementById('tellerNumber').value.trim();
            const depositor = document.getElementById('tellerDepositor').value.trim();
            
            if (!ref || !depositor) {
                const msg = currentLang === 'ha' ? 'Da fatan za a cika duk gurare.' : 'Please fill out all fields.';
                alert(msg);
                return;
            }

            try {
                const response = await LgaConnection.apiFetch('/api/payments/submit-manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentPayer.id,
                        taxId: activeTaxId,
                        paymentMethod: 'Bank Teller',
                        reference: ref,
                        depositorName: depositor,
                        amount: activeAmountToPay
                    })
                });

                const data = await response.json();
                if (data.success) {
                    const successMsg = currentLang === 'ha' ? 'An tura lambobin takardar banki cikin nasara! Tabbatarwa na nan tafe.' : 'Bank Teller serial details submitted successfully! Verification is in progress.';
                    alert(successMsg);
                    location.reload();
                } else {
                    const errorMsg = currentLang === 'ha' ? 'Kuskure yayin tura takardar banki: ' : 'Error submitting teller: ';
                    alert(`${errorMsg}${data.message}`);
                }
            } catch (err) {
                console.error(err);
                const serverErr = currentLang === 'ha' ? 'Kuskuren sadarwa. Da fatan za a duba hanyar sadarwar ku.' : 'Communication error. Please check your network.';
                alert(serverErr);
            }
        });
    }
});

window.payTax = function(taxId) {
    const tax = currentPayer.taxes.find(t => t.id === taxId);
    if (!tax) return;
    
    let amountToPay = tax.amount;

    // Handle variable amounts or zero amounts with a prompt (Self-Assessment)
    if (amountToPay <= 0) {
        const promptText = currentLang === 'ha' ? `Shigar da adadin da za a biya don ${tax.name} (a Naira):` : `Enter the amount to pay for ${tax.name} (in Naira):`;
        const userInput = prompt(promptText, "1000");
        if (userInput === null) return; // Cancelled
        amountToPay = parseFloat(userInput);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            const errorMsg = currentLang === 'ha' ? 'Da fatan za a shigar da adadin da ya dace.' : 'Please enter a valid amount.';
            alert(errorMsg);
            return;
        }
    }

    // Set globally for checkout forms
    activeTaxId = taxId;
    activeAmountToPay = amountToPay;

    // Populate Context Names in checkout details dynamically
    const lgaName = currentPayer.lga || 'Zamfara';
    const transferAccName = document.getElementById('transferAccName');
    const tellerAccName = document.getElementById('tellerAccName');
    const cashLgaOffice = document.getElementById('cashLgaOffice');

    if (transferAccName) {
        transferAccName.textContent = currentLang === 'ha' ? `Asusun Haraji Karamar Hukumar ${lgaName}` : `${lgaName} LGA Revenue Account`;
    }
    if (tellerAccName) {
        tellerAccName.textContent = currentLang === 'ha' ? `Asusun Haraji Karamar Hukumar ${lgaName}` : `${lgaName} LGA Revenue Account`;
    }
    if (cashLgaOffice) {
        cashLgaOffice.textContent = currentLang === 'ha' ? `Sakatariyar Karamar Hukumar ${lgaName}, Sashen Karɓar Haraji` : `${lgaName} LGA Secretariat, Revenue Department Desk`;
    }

    // Reset checkout forms to default (Online Paystack active)
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.querySelectorAll('.checkout-card').forEach(c => c.classList.remove('active'));
        checkoutModal.querySelectorAll('.checkout-form-panel').forEach(p => p.classList.remove('active'));
        
        checkoutModal.querySelector('.checkout-card[data-method="paystack"]')?.classList.add('active');
        document.getElementById('panel-paystack')?.classList.add('active');
        
        checkoutModal.classList.add('active');
    }
};

function triggerPaystackCheckout(taxId, amountToPay) {
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
}

async function verifyPayment(ref, taxId, amount) {
    const res = await LgaConnection.apiFetch(`/api/payments/verify/${ref}?id=${currentPayer.id}&taxId=${taxId}&amount=${amount}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        const successMsg = currentLang === 'ha' ? 'An biya kuɗi cikin nasara!' : 'Payment Successful!';
        alert(successMsg);
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
    
    const verificationUrl = `${window.location.origin}/verify.html?ref=${encodeURIComponent(tax.paymentReference || tax.id)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

    // Localized Strings
    const stateGov = currentLang === 'ha' ? 'GWAMNATIN JIHAR ZAMFARA' : 'ZAMFARA STATE GOVERNMENT';
    const revService = currentLang === 'ha' ? 'HUKUMAR KARƁAR HARAJI TA ƘARAMAR HUKUMA' : 'LOCAL GOVERNMENT REVENUE SERVICE';
    const adminHeader = currentLang === 'ha' ? `SHUGABANCI KARAMAR HUKUMAR ${lgaHeader}` : `${lgaHeader} ADMINISTRATION`;
    const officialReceipt = currentLang === 'ha' ? 'TAKARDAR BIYAN KUDI TA HUKUMA' : 'OFFICIAL RECEIPT';
    const paymentConfirmed = currentLang === 'ha' ? 'AN TABBATAR DA BIYA' : 'PAYMENT CONFIRMED';
    const payerNameLabel = currentLang === 'ha' ? 'SUNAN MAI BIYA' : 'PAYER NAME';
    const businessNameLabel = currentLang === 'ha' ? 'SUNAN KASUWANCI' : 'BUSINESS NAME';
    const payerRefLabel = currentLang === 'ha' ? 'LAMBAR HUJJA TA MAI BIYA' : 'PAYER REFERENCE';
    const phoneLabel = currentLang === 'ha' ? 'LAMBAR WAYA' : 'PHONE NUMBER';
    
    const taxDescHeader = currentLang === 'ha' ? 'BAYANIN HARAJI' : 'TAX DESCRIPTION';
    const cycleHeader = currentLang === 'ha' ? 'ZANGO' : 'CYCLE';
    const amtPaidHeader = currentLang === 'ha' ? 'ADADIN DA AKA BIYA' : 'AMOUNT PAID';
    const revenueItemSub = currentLang === 'ha' ? 'Kuɗin Haraji' : 'Revenue Item';
    const totalPaidLabel = currentLang === 'ha' ? 'JIMILLAR DA AKA BIYA' : 'TOTAL PAID';
    
    const datePaidLabel = currentLang === 'ha' ? 'RANAR BIYA' : 'DATE PAID';
    const timeLabel = currentLang === 'ha' ? 'LOKACI' : 'TIME';
    const methodLabel = currentLang === 'ha' ? 'HANYAR BIYA' : 'METHOD';
    const digitalMethod = currentLang === 'ha' ? 'Dijital (Paystack)' : 'Digital (Paystack)';
    
    const computerGeneratedNotice = currentLang === 'ha' 
        ? 'Wannan takardar biyan kuɗi ce da na\'ura ta ƙirƙira kuma ba ta buƙatar sa hannu.' 
        : 'This is a computer-generated receipt and requires no signature.';
    const thankYouNotice = currentLang === 'ha'
        ? `Mun gode da kuke goyon bayan ci gaban Karamar Hukumar ${payer.lga}.`
        : `Thank you for supporting the development of ${payer.lga} LGA.`;
    const verifiableLabel = currentLang === 'ha' ? 'ZA A IYA TABBATARWA' : 'VERIFIABLE';

    return `
        <div class="receipt-container" id="receiptContent">
            <div class="receipt-header">
                <div class="header-main">
                    <img src="logo.png" alt="Logo" class="receipt-logo">
                    <div class="government-info">
                        <h2>${stateGov}</h2>
                        <h3>${revService}</h3>
                        <p>${adminHeader}</p>
                    </div>
                    <div class="receipt-badge">${officialReceipt}</div>
                </div>
            </div>

            <div class="receipt-body">
                <div class="success-banner">
                    <div class="check-icon">✓</div>
                    <div class="payment-confirmed">
                        <h4>${paymentConfirmed}</h4>
                        <p>Ref: ${tax.paymentReference || 'N/A'}</p>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <label>${payerNameLabel}</label>
                        <p>${payer.contactPerson}</p>
                    </div>
                    <div class="info-item">
                        <label>${businessNameLabel}</label>
                        <p>${payer.businessName}</p>
                    </div>
                    <div class="info-item">
                        <label>${payerRefLabel}</label>
                        <p>${payer.invoiceRef}</p>
                    </div>
                    <div class="info-item">
                        <label>${phoneLabel}</label>
                        <p>${payer.phoneNumber}</p>
                    </div>
                </div>

                <div class="payment-details">
                    <table>
                        <thead>
                            <tr>
                                <th>${taxDescHeader}</th>
                                <th>${cycleHeader}</th>
                                <th class="text-right">${amtPaidHeader}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="tax-name">${tax.name}</span>
                                    <span class="tax-desc">${revenueItemSub}</span>
                                </td>
                                <td>${tax.duration}</td>
                                <td class="text-right amount">₦${amount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2">${totalPaidLabel}</td>
                                <td class="text-right total">₦${amount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="payment-meta">
                    <div class="meta-item">
                        <label>${datePaidLabel}</label>
                        <p>${dateStr}</p>
                    </div>
                    <div class="meta-item">
                        <label>${timeLabel}</label>
                        <p>${timeStr}</p>
                    </div>
                    <div class="meta-item">
                        <label>${methodLabel}</label>
                        <p>${digitalMethod}</p>
                    </div>
                </div>
            </div>

            <div class="receipt-footer">
                <div class="footer-notice">
                    <p>${computerGeneratedNotice}</p>
                    <p>${thankYouNotice}</p>
                </div>
                <div class="qr-placeholder" style="border: none; background: transparent; text-align: center;">
                    <img src="${qrUrl}" alt="Verification QR Code" style="width: 50px; height: 50px; display: block; margin: 0 auto 4px auto; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <span style="font-size: 6.5px; font-weight: 800; color: #10b981; letter-spacing: 1px;">${verifiableLabel}</span>
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
    localStorage.removeItem('lga_jwt_token');
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

// Open external grievances portal deep-linked with payer context
window.openGrievancesPortal = function() {
    if (!currentPayer) return;
    const name = encodeURIComponent(currentPayer.contactPerson || '');
    const phone = encodeURIComponent(currentPayer.phoneNumber || '');
    const ref = encodeURIComponent(currentPayer.invoiceRef || '');
    const lga = encodeURIComponent(currentPayer.lga || '');
    
    window.open(`grievances.html?name=${name}&phone=${phone}&ref=${ref}&lga=${lga}`, '_blank');
};
