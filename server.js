const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const smsHelper = require('./smsHelper');

const app = express();
const PORT = process.env.PORT || 3000;

// Runtime-mutable Paystack config (overridden via /api/settings/paystack)
let runtimeConfig = {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    paystackPublicKey: '',
    paystackMode: 'test',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
};

// Middleware
app.use(cors());
app.use(express.json());

// --- Deployment: Static File Serving ---
// Security: Prevent direct access to the data folder via HTTP
app.use('/data', (req, res) => {
    res.status(403).json({ error: 'Access Denied' });
});

// Serve all frontend assets from the root directory
app.use(express.static(path.join(__dirname)));

// Fallback to landing.html for root or unknown paths (for cleaner URLs)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Error handling for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ success: false, message: 'Invalid JSON' });
    }
    next();
});

// Data file paths
const dataDir = path.join(__dirname, 'data');
const revenuesFile = path.join(dataDir, 'revenues.json');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory and files exist
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(revenuesFile)) fs.writeFileSync(revenuesFile, JSON.stringify([]));
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([
        {
            id: '1',
            name: 'Super Admin',
            username: 'admin',
            password: 'password123',
            email: 'admin@zamfara.gov.ng',
            role: 'Super Admin',
            lga: 'System-wide',
            status: 'Active'
        }
    ], null, 2));
}

// Helpers
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- Tax Rates API ---
const taxRatesFile = path.join(dataDir, 'tax_rates.json');
app.get('/api/tax-rates', (req, res) => {
    const taxRates = readJsonFile(taxRatesFile);
    res.json(taxRates);
});

// --- Revenues API ---
app.get('/api/revenues', (req, res) => {
    let revenues = readJsonFile(revenuesFile);
    console.log(`[API] Fetching revenues. Query LGA: ${req.query.lga}`);
    
    // Optional LGA filter for role-based access
    if (req.query.lga && req.query.lga !== 'System-wide') {
        const filterLga = req.query.lga.toLowerCase().trim();
        revenues = revenues.filter(r => {
            const recordLga = (r.lga || r.city || '').toLowerCase().trim();
            return recordLga === filterLga;
        });
        console.log(`[API] Filtered to ${revenues.length} records for LGA: ${filterLga}`);
    }
    // Individual capture filter
    if (req.query.capturedBy) {
        revenues = revenues.filter(r => String(r.capturedBy) === String(req.query.capturedBy));
        console.log(`[API] Further filtered by capturedBy: ${req.query.capturedBy}. Result: ${revenues.length}`);
    }
    res.json(revenues);
});

app.post('/api/revenues', (req, res) => {
    try {
        const newRevenues = Array.isArray(req.body) ? req.body : [req.body];
        const revenues = readJsonFile(revenuesFile);
        
        // Add unique Invoice Reference to each new record if it doesn't have one
        const processedRevenues = newRevenues.map(r => {
            if (!r.invoiceRef) {
                const year = new Date().getFullYear();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                r.invoiceRef = `LGA/REV/${year}/${random}`;
            }
            return r;
        });

        if (req.query.overwrite === 'true') {
            writeJsonFile(revenuesFile, processedRevenues);
            res.json({ success: true, message: 'Revenues overwritten', count: processedRevenues.length });
        } else {
            revenues.push(...processedRevenues);
            writeJsonFile(revenuesFile, revenues);
            
            // Trigger Registration SMS for each new record
            processedRevenues.forEach(r => {
                if (r.phoneNumber) {
                    const hostUrl = req.protocol + '://' + req.get('host');
                    const msg = `LGA RevMax: Welcome ${r.businessName}! Your Invoice Ref is ${r.invoiceRef}. Total taxes assigned: ${r.taxes ? r.taxes.length : 0}. Access portal at: ${hostUrl}/portal.html`;
                    smsHelper.send(r.phoneNumber, msg, 'Registration');
                }
            });

            res.json({ success: true, message: 'Revenues added', added: processedRevenues.length, added_ref: processedRevenues[0]?.invoiceRef });
        }
    } catch (error) {
        console.error('Error saving revenues:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/revenues/:id', (req, res) => {
    try {
        const id = req.params.id;
        const updatedRecord = req.body;
        const revenues = readJsonFile(revenuesFile);
        const index = revenues.findIndex(r => r.id === id);
        
        if (index !== -1) {
            // Ensure we don't accidentally lose who captured the record if the update is partial
            revenues[index] = { 
                ...revenues[index], 
                ...updatedRecord,
                capturedBy: updatedRecord.capturedBy || revenues[index].capturedBy,
                capturedByName: updatedRecord.capturedByName || revenues[index].capturedByName
            };
            writeJsonFile(revenuesFile, revenues);
            res.json({ success: true, message: 'Revenue record updated', record: revenues[index] });
        } else {
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/revenues/:id', (req, res) => {
    try {
        const id = req.params.id;
        const revenues = readJsonFile(revenuesFile);
        const newRevenues = revenues.filter(r => r.id !== id);
        
        if (newRevenues.length < revenues.length) {
            writeJsonFile(revenuesFile, newRevenues);
            res.json({ success: true, message: 'Revenue record deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Users API ---
app.get('/api/users', (req, res) => {
    const users = readJsonFile(usersFile);
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const newUser = req.body;
    const users = readJsonFile(usersFile);
    users.push(newUser);
    writeJsonFile(usersFile, users);
    res.json({ message: 'User added', user: newUser });
});

app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    if (id === '1') {
        return res.status(403).json({ message: 'Cannot delete Super Admin' });
    }
    let users = readJsonFile(usersFile);
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length < initialLength) {
        writeJsonFile(usersFile, users);
        res.json({ message: 'User deleted' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// --- Payments API (Paystack Integration) ---
app.post('/api/payments/verify/:reference', (req, res) => {
    const reference = req.params.reference;
    const payerId = req.query.id;
    const taxId = req.query.taxId;
    
    // Use runtime config if set, otherwise fall back to env/placeholder
    const PAYSTACK_SECRET_KEY = runtimeConfig.paystackSecretKey || 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    
    // --- Simulation Mode Bypass ---
    if (reference.startsWith('SIM-')) {
        console.log('Simulating successful payment for:', reference);
        const revenues = readJsonFile(revenuesFile);
        const payerIndex = revenues.findIndex(r => r.id === payerId);
        
        if (payerIndex !== -1) {
            const payer = revenues[payerIndex];
            if (!payer.taxes) payer.taxes = [];
            const taxIndex = payer.taxes.findIndex(tx => tx.id === taxId);
            
            if (taxIndex !== -1) {
                const paidAmount = parseFloat(req.query.amount) || payer.taxes[taxIndex].amount;
                payer.taxes[taxIndex].status = 'Paid';
                payer.taxes[taxIndex].paymentReference = reference;
                payer.taxes[taxIndex].paymentDate = new Date().toISOString();
                payer.taxes[taxIndex].amountPaid = paidAmount;
                // Update assessed amount if it was variable
                if (payer.taxes[taxIndex].amount <= 0) {
                    payer.taxes[taxIndex].amount = paidAmount;
                }
                
                const allPaid = payer.taxes.every(tx => tx.status === 'Paid' || tx.amount <= 0);
                if (allPaid) payer.status = 'Paid';
                else payer.status = 'Partial';
                
                writeJsonFile(revenuesFile, revenues);
                
                // Trigger Payment SMS (Simulation)
                if (payer.phoneNumber) {
                    const tax = payer.taxes[taxIndex];
                    const msg = `LGA RevMax: Payment confirmed! ₦${tax.amountPaid.toLocaleString()} for ${tax.name}. Ref: ${reference}. Thank you for your contribution to ${payer.lga} LGA.`;
                    smsHelper.send(payer.phoneNumber, msg, 'Payment');
                }

                return res.json({ success: true, message: 'SIMULATION: Tax payment verified', payer: payer });
            }
        }
        return res.status(404).json({ success: false, message: 'Simulation target not found' });
    }

    axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
    })
    .then(response => {
        const data = response.data.data;
        
        if (data.status === 'success') {
            const revenues = readJsonFile(revenuesFile);
            const payerIndex = revenues.findIndex(r => r.id === payerId);
            
            if (payerIndex !== -1) {
                const payer = revenues[payerIndex];
                
                // Initialize taxes array if it doesn't exist (legacy support)
                if (!payer.taxes) payer.taxes = [];
                
                const taxIndex = payer.taxes.findIndex(tx => tx.id === taxId);
                
                if (taxIndex !== -1) {
                    // Update specific tax status
                    payer.taxes[taxIndex].status = 'Paid';
                    payer.taxes[taxIndex].paymentReference = reference;
                    payer.taxes[taxIndex].paymentDate = new Date().toISOString();
                    payer.taxes[taxIndex].amountPaid = data.amount / 100;
                    
                    // Update overall status if all taxes are paid
                    const allPaid = payer.taxes.every(tx => tx.status === 'Paid' || tx.amount <= 0);
                    if (allPaid) payer.status = 'Paid';
                    else payer.status = 'Partial';
                    
                    writeJsonFile(revenuesFile, revenues);

                    // Trigger Payment SMS (Live)
                    if (payer.phoneNumber) {
                        const tax = payer.taxes[taxIndex];
                        const msg = `LGA RevMax: Payment confirmed! ₦${tax.amountPaid.toLocaleString()} for ${tax.name}. Ref: ${reference}. Thank you for your contribution to ${payer.lga} LGA.`;
                        smsHelper.send(payer.phoneNumber, msg, 'Payment');
                    }

                    res.json({ success: true, message: 'Tax payment verified', payer: payer });
                } else {
                    res.status(404).json({ success: false, message: 'Tax item not found in payer profile' });
                }
            } else {
                res.status(404).json({ success: false, message: 'Tax payer profile not found' });
            }
        } else {
            res.status(400).json({ success: false, message: `Payment failed: ${data.gateway_response}` });
        }
    })
    .catch(error => {
        console.error('Paystack verification error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error communicating with Paystack API',
            error: error.response ? error.response.data.message : error.message 
        });
    });
});

// --- Settings API ---
app.post('/api/settings/paystack', (req, res) => {
    const { secretKey, publicKey, mode } = req.body;
    if (!secretKey) return res.status(400).json({ success: false, message: 'secretKey is required' });
    runtimeConfig.paystackSecretKey = secretKey;
    runtimeConfig.paystackPublicKey = publicKey || '';
    runtimeConfig.paystackMode = mode || 'test';
    console.log(`[Settings] Paystack ${mode || 'test'} keys updated at runtime.`);
    res.json({ success: true, message: 'Paystack keys updated for this session.' });
});

app.get('/api/settings', (req, res) => {
    res.json({
        paystackMode: runtimeConfig.paystackMode,
        paystackPublicKey: runtimeConfig.paystackPublicKey,
        hasSecretKey: !!runtimeConfig.paystackSecretKey && !runtimeConfig.paystackSecretKey.includes('xxx')
    });
});

// --- Auth API ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJsonFile(usersFile);
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

// --- Request Logger ---
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// --- Health Check ---
app.get('/api/health', (req, res) => {
    const dataDir = path.join(__dirname, 'data');
    const revenuesFile = path.join(dataDir, 'revenues.json');
    const usersFile = path.join(dataDir, 'users.json');
    
    res.json({ 
        status: 'online', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage().rss,
        storage: {
            revenues: fs.existsSync(revenuesFile),
            users: fs.existsSync(usersFile)
        }
    });
});

// --- Notifications API ---
app.get('/api/notifications', (req, res) => {
    res.json(smsHelper.getLogs());
});

// --- Grievances API ---
const grievancesFile = path.join(dataDir, 'grievances.json');
if (!fs.existsSync(grievancesFile)) fs.writeFileSync(grievancesFile, JSON.stringify([]));

// GET all grievances (with optional LGA filter)
app.get('/api/grievances', (req, res) => {
    let grievances = readJsonFile(grievancesFile);
    if (req.query.lga && req.query.lga !== 'System-wide') {
        grievances = grievances.filter(g => g.lga === req.query.lga);
    }
    // Sort newest first
    grievances.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(grievances);
});

// GET single grievance by reference code (for public tracker)
app.get('/api/grievances/:ref', (req, res) => {
    const grievances = readJsonFile(grievancesFile);
    const ref = decodeURIComponent(req.params.ref);
    // Try matching by ref code first, then by id
    const found = grievances.find(g => g.ref === ref || g.id === ref);
    if (found) {
        res.json(found);
    } else {
        res.status(404).json({ success: false, message: 'Grievance not found' });
    }
});

// POST new grievance (public submission)
app.post('/api/grievances', (req, res) => {
    try {
        const grievance = req.body;
        if (!grievance.name || !grievance.lga || !grievance.subject || !grievance.description) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const grievances = readJsonFile(grievancesFile);
        // Ensure unique ref
        grievance.id = grievance.id || Date.now().toString();
        grievance.submittedAt = grievance.submittedAt || new Date().toISOString();
        grievance.status = 'Pending';
        grievances.push(grievance);
        writeJsonFile(grievancesFile, grievances);
        console.log(`[Grievances] New submission: ${grievance.ref} from ${grievance.name} (${grievance.lga})`);
        res.json({ success: true, message: 'Grievance submitted', ref: grievance.ref });
    } catch (err) {
        console.error('Error saving grievance:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update grievance status / response (admin)
app.put('/api/grievances/:id', (req, res) => {
    try {
        const id = req.params.id;
        const update = req.body;
        const grievances = readJsonFile(grievancesFile);
        const idx = grievances.findIndex(g => g.id === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Grievance not found' });
        grievances[idx] = { ...grievances[idx], ...update };
        writeJsonFile(grievancesFile, grievances);
        res.json({ success: true, message: 'Grievance updated', grievance: grievances[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE grievance (admin only, hard delete)
app.delete('/api/grievances/:id', (req, res) => {
    try {
        const id = req.params.id;
        let grievances = readJsonFile(grievancesFile);
        const initial = grievances.length;
        grievances = grievances.filter(g => g.id !== id);
        if (grievances.length < initial) {
            writeJsonFile(grievancesFile, grievances);
            res.json({ success: true, message: 'Grievance deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Grievance not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`LGA Revenues server running on port ${PORT}`);
});
