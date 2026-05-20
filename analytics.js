// Global State
const LGAS = [
    "Anka", "Bakura", "Birnin Magaji", "Bukkuyum", "Bungudu", "Gummi", 
    "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", 
    "Tsafe", "Zurmi"
];
let currentContextLga = 'System-wide';

// Auth & Session
feather.replace();

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
        titleEl.textContent = currentContextLga === 'System-wide' ? 'Revenue Analytics' : `${currentContextLga} Analytics`;
    }
}
updateTitle();

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('lga_user');
    window.location.href = 'landing.html';
});

// Date label
const now = new Date();
document.getElementById('currentDateLabel').textContent = now.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
});

// ── Chart colour palette ──────────────────────────────────────────────────────
const PALETTE = {
    indigo:  '#6366f1',
    emerald: '#10b981',
    amber:   '#f59e0b',
    rose:    '#f43f5e',
    purple:  '#8b5cf6',
    sky:     '#0ea5e9',
    teal:    '#14b8a6',
    orange:  '#f97316',
    lime:    '#84cc16',
    pink:    '#ec4899',
};

const PALETTE_ARRAY = Object.values(PALETTE);

// Chart.js global defaults for a premium look
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.legend.display = false;
Chart.defaults.animation.duration = 900;
Chart.defaults.animation.easing  = 'easeOutQuart';

// ── Stored chart instances (for re-render on refresh) ────────────────────────
const charts = {};

// --- LGA Sidebar Navigation ---
function initLgaSidebar() {
    const list = document.getElementById('sidebarLgaList');
    if (!list) return;

    if (currentUser.role !== 'Super Admin') {
        // Enforce context lock
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
    if (window.location.pathname.includes('analytics.html')) {
        currentContextLga = lga;
        updateTitle();
        initLgaSidebar();
        loadAnalytics();
        // Update URL without refresh
        const newUrl = lga === 'System-wide' ? 'analytics.html' : `analytics.html?lga=${encodeURIComponent(lga)}`;
        window.history.pushState({ lga }, '', newUrl);
    } else {
        window.location.href = `analytics.html?lga=${encodeURIComponent(lga)}`;
    }
};

initLgaSidebar();

// ── Main Data Fetch & Processing ─────────────────────────────────────────────
async function loadAnalytics() {
    let revenues = [];
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

        const res = await fetch(url);
        revenues = await res.json();
    } catch (e) {
        console.error('Analytics: failed to fetch revenues', e);
    }

    // ── KPIs ────────────────────────────────────────────────────────────────
    let totalCollected = 0;
    let totalPending   = 0;
    let totalTaxItems  = 0;
    let paidItems      = 0;

    revenues.forEach(r => {
        if (r.taxes && Array.isArray(r.taxes)) {
            r.taxes.forEach(tx => {
                totalTaxItems++;
                if (tx.status === 'Paid') {
                    totalCollected += (tx.amountPaid || tx.amount || 0);
                    paidItems++;
                } else {
                    totalPending += (tx.amount || 0);
                }
            });
        } else if (r.chargeRate) {
            totalTaxItems++;
            const amountMatch = (r.chargeRate || '').match(/₦?([0-9,]+)/);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
            if (r.status === 'Paid') {
                totalCollected += amount;
                paidItems++;
            } else {
                totalPending += amount;
            }
        }
    });

    const uniqueLgas = new Set(revenues.map(r => r.lga || r.city).filter(Boolean));
    const collectionRate = totalTaxItems > 0
        ? Math.round((paidItems / totalTaxItems) * 100)
        : 0;

    animateCount('kpiTaxpayers', revenues.length, '', '');
    animateCount('kpiCollected', totalCollected, '₦', '', true);
    animateCount('kpiPending',   totalPending,   '₦', '', true);
    animateCount('kpiLgas',      uniqueLgas.size, '', '');
    animateCount('kpiRate',      collectionRate,  '', '%');

    // ── Chart 1: Revenue by LGA (Bar) ───────────────────────────────────────
    const lgaMap = {};
    revenues.forEach(r => {
        const lga = r.lga || r.city || 'Unknown';
        if (!lgaMap[lga]) lgaMap[lga] = 0;
        if (r.taxes && Array.isArray(r.taxes)) {
            r.taxes.forEach(tx => { lgaMap[lga] += (tx.amount || 0); });
        } else if (r.chargeRate) {
            const amountMatch = (r.chargeRate || '').match(/₦?([0-9,]+)/);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
            lgaMap[lga] += amount;
        }
    });

    const lgaSorted = Object.entries(lgaMap).sort((a, b) => b[1] - a[1]);
    const lgaLabels = lgaSorted.map(e => e[0]);
    const lgaValues = lgaSorted.map(e => e[1]);

    renderOrUpdate('lgaBarChart', 'bar', {
        labels: lgaLabels.length ? lgaLabels : ['No Data'],
        datasets: [{
            label: 'Total Assessed (₦)',
            data: lgaValues.length ? lgaValues : [0],
            backgroundColor: lgaLabels.map((_, i) => PALETTE_ARRAY[i % PALETTE_ARRAY.length] + 'cc'),
            borderColor:     lgaLabels.map((_, i) => PALETTE_ARRAY[i % PALETTE_ARRAY.length]),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
        }]
    }, {
        plugins: {
            tooltip: {
                callbacks: {
                    label: ctx => ' ₦' + ctx.parsed.y.toLocaleString()
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: '600' }, maxRotation: 35 }
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: {
                    callback: v => {
                        if (v >= 1e12) return '₦' + (v / 1e12).toFixed(1) + 'T';
                        if (v >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
                        if (v >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
                        if (v >= 1e3) return '₦' + (v / 1e3).toFixed(0) + 'k';
                        return '₦' + v;
                    },
                    font: { size: 10 }
                }
            }
        }
    });

    // ── Chart 2: Payment Status Doughnut ────────────────────────────────────
    const paid    = totalTaxItems > 0 ? paidItems : 0;
    const pending = totalTaxItems > 0 ? (totalTaxItems - paidItems) : 1;

    renderOrUpdate('statusDonut', 'doughnut', {
        labels: ['Paid', 'Pending'],
        datasets: [{
            data: [paid, pending],
            backgroundColor: ['#6366f1cc', '#f59e0bcc'],
            borderColor:     ['#6366f1',   '#f59e0b'],
            borderWidth: 2,
            hoverOffset: 12,
        }]
    }, {
        cutout: '68%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} items` }
            }
        }
    });

    // Donut legend
    const legendEl = document.getElementById('donutLegend');
    legendEl.innerHTML = [
        { label: 'Paid',    value: paid,    color: '#6366f1' },
        { label: 'Pending', value: pending, color: '#f59e0b' },
    ].map(item => `
        <div class="donut-legend-item">
            <div class="donut-legend-left">
                <div class="donut-legend-dot" style="background:${item.color};"></div>
                <span class="donut-legend-label">${item.label}</span>
            </div>
            <span class="donut-legend-value">${item.value} items</span>
        </div>
    `).join('');

    // ── Chart 3: Tax Categories (Horizontal Bar) ─────────────────────────────
    const categoryMap = {};
    revenues.forEach(r => {
        if (r.taxes && Array.isArray(r.taxes)) {
            r.taxes.forEach(tx => {
                // Derive category from tax name prefix (first word group)
                const cat = tx.name.split(' ')[0] || 'Other';
                if (!categoryMap[cat]) categoryMap[cat] = 0;
                categoryMap[cat] += (tx.amount || 0);
            });
        } else if (r.chargeRate) {
            const amountMatch = (r.chargeRate || '').match(/₦?([0-9,]+)/);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
            if (amount > 0) {
                const firstTax = (r.assignedTax || '').split(',')[0].trim();
                const cat = firstTax.split(' ')[0] || 'Other';
                if (!categoryMap[cat]) categoryMap[cat] = 0;
                categoryMap[cat] += amount;
            }
        }
    });

    const catSorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const catLabels = catSorted.map(e => e[0]);
    const catValues = catSorted.map(e => e[1]);
    const catMax    = catValues[0] || 1;

    renderOrUpdate('categoryBar', 'bar', {
        labels: catLabels.length ? catLabels : ['No Data'],
        datasets: [{
            label: 'Revenue (₦)',
            data: catValues.length ? catValues : [0],
            backgroundColor: catLabels.map((_, i) => PALETTE_ARRAY[i % PALETTE_ARRAY.length] + 'bb'),
            borderColor:     catLabels.map((_, i) => PALETTE_ARRAY[i % PALETTE_ARRAY.length]),
            borderWidth: 2,
            borderRadius: 6,
        }]
    }, {
        indexAxis: 'y',
        plugins: {
            tooltip: {
                callbacks: { label: ctx => ' ₦' + ctx.parsed.x.toLocaleString() }
            }
        },
        scales: {
            x: {
                grid: { color: '#f1f5f9' },
                ticks: {
                    callback: v => {
                        if (v >= 1e12) return '₦' + (v / 1e12).toFixed(1) + 'T';
                        if (v >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
                        if (v >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
                        if (v >= 1e3) return '₦' + (v / 1e3).toFixed(0) + 'k';
                        return '₦' + v;
                    },
                    font: { size: 9 }
                }
            },
            y: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: '600' } }
            }
        }
    });

    // ── Chart: Registration Source (Portal vs Admin vs Officer) ──────────
    const sourceMap = { portal: 0, admin: 0, officer: 0 };
    revenues.forEach(r => {
        if (r.origin === 'Portal') sourceMap.portal++;
        else if (r.origin === 'Officer') sourceMap.officer++;
        else sourceMap.admin++;
    });

    renderOrUpdate('sourceChart', 'bar', {
        labels: ['Portal (Self-Service)', 'Admin Entry', 'Revenue Officer'],
        datasets: [{
            data: [sourceMap.portal, sourceMap.admin, sourceMap.officer],
            backgroundColor: [PALETTE.purple + 'cc', PALETTE.indigo + 'cc', PALETTE.teal + 'cc'],
            borderColor:     [PALETTE.purple,       PALETTE.indigo,       PALETTE.teal],
            borderWidth: 2,
            borderRadius: 8,
        }]
    }, {
        indexAxis: 'y',
        plugins: {
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} registrations` } }
        },
        scales: {
            x: { grid: { display: false }, ticks: { stepSize: 1 } },
            y: { grid: { display: false }, ticks: { font: { weight: '600' } } }
        }
    });

    // ── Top Taxpayers List ───────────────────────────────────────────────────
    const taxpayerTotals = revenues.map(r => {
        let total = 0;
        if (r.taxes && Array.isArray(r.taxes)) {
            total = r.taxes.reduce((acc, tx) => acc + (tx.amount || 0), 0);
        } else if (r.chargeRate) {
            const amountMatch = (r.chargeRate || '').match(/₦?([0-9,]+)/);
            total = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        }
        return { name: r.businessName || 'Unknown', lga: r.lga || r.city || '', total };
    }).sort((a, b) => b.total - a.total).slice(0, 7);

    const listEl = document.getElementById('topTaxpayersList');
    if (taxpayerTotals.length === 0) {
        listEl.innerHTML = '<div class="analytics-empty">No taxpayer data available</div>';
    } else {
        listEl.innerHTML = taxpayerTotals.map((t, i) => {
            const medalClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            return `
            <div class="taxpayer-rank-item">
                <div class="rank-number ${medalClass}">${i + 1}</div>
                <div class="rank-info">
                    <div class="rank-name">${t.name}</div>
                    <div class="rank-lga">${t.lga}</div>
                </div>
                <div class="rank-amount">₦${t.total.toLocaleString()}</div>
            </div>`;
        }).join('');
    }

    // ── Chart 4: Area Classification (Doughnut/Polar) ────────────────────────
    const areaMap = { urban: 0, semiUrban: 0, subUrban: 0 };
    revenues.forEach(r => {
        const cls = r.areaClass || 'urban';
        areaMap[cls] = (areaMap[cls] || 0) + 1;
    });

    renderOrUpdate('areaChart', 'doughnut', {
        labels: ['Urban', 'Semi-Urban', 'Rural'],
        datasets: [{
            data: [areaMap.urban, areaMap.semiUrban, areaMap.subUrban],
            backgroundColor: ['#6366f1cc', '#10b981cc', '#f59e0bcc'],
            borderColor:     ['#6366f1',   '#10b981',   '#f59e0b'],
            borderWidth: 2,
            hoverOffset: 10,
        }]
    }, {
        cutout: '55%',
        plugins: {
            legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} taxpayers` } }
        }
    });

    // ── Chart 5: Tax Items per Taxpayer distribution ─────────────────────────
    const taxCounts = {};
    revenues.forEach(r => {
        let cnt = 0;
        if (r.taxes && Array.isArray(r.taxes)) {
            cnt = r.taxes.length;
        } else if (r.chargeRate) {
            cnt = 1;
        }
        const key = cnt === 0 ? '0' : cnt <= 2 ? '1-2' : cnt <= 5 ? '3-5' : '6+';
        taxCounts[key] = (taxCounts[key] || 0) + 1;
    });

    const buckets = ['0', '1-2', '3-5', '6+'];
    renderOrUpdate('taxItemsChart', 'bar', {
        labels: buckets,
        datasets: [{
            label: 'Taxpayers',
            data: buckets.map(b => taxCounts[b] || 0),
            backgroundColor: [PALETTE.rose+'cc', PALETTE.emerald+'cc', PALETTE.indigo+'cc', PALETTE.purple+'cc'],
            borderColor:     [PALETTE.rose,       PALETTE.emerald,       PALETTE.indigo,       PALETTE.purple],
            borderWidth: 2,
            borderRadius: 8,
        }]
    }, {
        plugins: {
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} taxpayers` } }
        },
        scales: {
            x: {
                grid: { display: false },
                title: { display: true, text: 'Number of Tax Items', font: { size: 11 } }
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 11 }, stepSize: 1 }
            }
        }
    });

    // ── Chart: Revenue Collection Timeline (Line Chart) ──────────────────────
    const timelineMap = {};
    
    revenues.forEach(r => {
        // Deriving date from ID (assuming 13-digit timestamp)
        let creationDateStr = null;
        const idTimestamp = parseInt(r.id);
        if (!isNaN(idTimestamp) && r.id.length >= 13) {
            creationDateStr = new Date(idTimestamp).toISOString().split('T')[0];
        } else if (r.id.includes('_')) {
            const parts = r.id.split('_');
            const ts = parseInt(parts[parts.length - 1]);
            if (!isNaN(ts)) creationDateStr = new Date(ts).toISOString().split('T')[0];
        }
        
        if (creationDateStr) {
            if (!timelineMap[creationDateStr]) timelineMap[creationDateStr] = { assessed: 0, collected: 0 };
            if (r.taxes && Array.isArray(r.taxes)) {
                r.taxes.forEach(tx => {
                    timelineMap[creationDateStr].assessed += (tx.amount || 0);
                });
            } else if (r.chargeRate) {
                const amountMatch = (r.chargeRate || '').match(/₦?([0-9,]+)/);
                const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
                timelineMap[creationDateStr].assessed += amount;
            }
        }

        // Collected revenue should be mapped to the actual payment date if available
        if (r.taxes && Array.isArray(r.taxes)) {
            r.taxes.forEach(tx => {
                if (tx.status === 'Paid' && tx.paymentDate) {
                    const pDateStr = tx.paymentDate.split('T')[0];
                    if (!timelineMap[pDateStr]) timelineMap[pDateStr] = { assessed: 0, collected: 0 };
                    timelineMap[pDateStr].collected += (tx.amountPaid || tx.amount || 0);
                }
            });
        } else if (r.chargeRate && r.status === 'Paid') {
            let pDateStr = r.paymentDate ? r.paymentDate.split('T')[0] : creationDateStr;
            if (pDateStr) {
                const amountMatch = (r.chargeRate || '').match(/₦?([0-9,]+)/);
                const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
                if (!timelineMap[pDateStr]) timelineMap[pDateStr] = { assessed: 0, collected: 0 };
                timelineMap[pDateStr].collected += amount;
            }
        }
    });

    const sortedTimeline = Object.entries(timelineMap).sort((a, b) => a[0].localeCompare(b[0]));
    const timelineLabels = sortedTimeline.map(e => {
        const d = new Date(e[0]);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    });
    const assessedPoints = sortedTimeline.map(e => e[1].assessed);
    const collectedPoints = sortedTimeline.map(e => e[1].collected);

    renderOrUpdate('timelineChart', 'line', {
        labels: timelineLabels.length ? timelineLabels : ['No Data'],
        datasets: [
            {
                label: 'Total Assessed',
                data: assessedPoints,
                borderColor: PALETTE.indigo,
                backgroundColor: PALETTE.indigo + '22',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 3
            },
            {
                label: 'Actually Collected',
                data: collectedPoints,
                borderColor: PALETTE.emerald,
                backgroundColor: PALETTE.emerald + '22',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 3
            }
        ]
    }, {
        interaction: { intersect: false, mode: 'index' },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { 
                grid: { color: '#f1f5f9' },
                ticks: { 
                    callback: v => {
                        if (v >= 1e12) return '₦' + (v / 1e12).toFixed(1) + 'T';
                        if (v >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
                        if (v >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
                        if (v >= 1e3) return '₦' + (v / 1e3).toFixed(0) + 'k';
                        return '₦' + v;
                    },
                    font: { size: 10 }
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ₦${ctx.parsed.y.toLocaleString()}`
                }
            }
        }
    });

    feather.replace();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Renders a new chart or destroys & re-renders on refresh */
function renderOrUpdate(id, type, data, options = {}) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
    const ctx = document.getElementById(id);
    if (!ctx) return;
    charts[id] = new Chart(ctx, {
        type,
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options,
            plugins: {
                ...(options.plugins || {}),
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    titleFont: { size: 12, weight: '700' },
                    bodyFont:  { size: 11 },
                    padding: 10,
                    cornerRadius: 8,
                    ...(options.plugins?.tooltip || {})
                }
            }
        }
    });
}

/** Animates a numeric KPI counter */
function animateCount(elId, target, prefix = '', suffix = '', isMoney = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    let current = 0;
    const step  = Math.max(1, Math.ceil(target / 60));
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        if (isMoney) {
            el.textContent = prefix + current.toLocaleString() + suffix;
        } else {
            el.textContent = prefix + current + suffix;
        }
        if (current >= target) clearInterval(timer);
    }, 16);
}

// ── Refresh button ───────────────────────────────────────────────────────────
document.getElementById('refreshBtn').addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    btn.style.opacity = '0.5';
    btn.disabled = true;
    loadAnalytics().finally(() => {
        btn.style.opacity = '1';
        btn.disabled = false;
    });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
loadAnalytics();
