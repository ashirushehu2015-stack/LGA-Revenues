const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const smsHelper = require('./smsHelper');
const { dbQuery } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'lga_revmax_secure_secret_key_2026_zamfara';

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

const dataDir = path.join(__dirname, 'data');

// Helpers for remaining JSON operations (e.g. read-only tax rates)
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// --- Security Middleware: JWT Auth ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or Expired Session Token' });
        }
        req.user = user;
        next();
    });
}

// --- Tax Rates API ---
const taxRatesFile = path.join(dataDir, 'tax_rates.json');
app.get('/api/tax-rates', (req, res) => {
    const taxRates = readJsonFile(taxRatesFile);
    res.json(taxRates);
});

// --- Revenues API ---
app.get('/api/revenues', authenticateToken, async (req, res) => {
    try {
        console.log(`[API] Fetching revenues from SQLite. Query LGA: ${req.query.lga}`);
        let query = 'SELECT * FROM revenues WHERE 1=1';
        const params = [];

        if (req.query.lga && req.query.lga !== 'System-wide') {
            query += ' AND LOWER(TRIM(lga)) = LOWER(TRIM(?))';
            params.push(req.query.lga);
        }
        if (req.query.capturedBy) {
            query += ' AND capturedBy = ?';
            params.push(req.query.capturedBy);
        }

        const rows = await dbQuery.all(query, params);
        const revenues = rows.map(r => {
            return {
                ...r,
                taxes: r.taxes ? JSON.parse(r.taxes) : []
            };
        });
        res.json(revenues);
    } catch (error) {
        console.error('Error fetching revenues:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/revenues', async (req, res) => {
    try {
        const newRevenues = Array.isArray(req.body) ? req.body : [req.body];
        
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
            await dbQuery.run('DELETE FROM revenues');
        }

        for (const r of processedRevenues) {
            const taxesStr = r.taxes ? JSON.stringify(r.taxes) : JSON.stringify([]);
            
            // Generate standard passwords if none specified
            let pwd = r.password;
            if (!pwd) pwd = r.phoneNumber || '0000000';
            
            // Hash password if plain text
            if (pwd && !pwd.startsWith('$2b$')) {
                pwd = bcrypt.hashSync(pwd, 10);
            }

            await dbQuery.run(
                `INSERT OR REPLACE INTO revenues (id, businessName, businessAddress, lga, areaClass, lineOfBusiness, contactPerson, addressCp, phoneNumber, status, assignedTax, chargeRate, origin, invoiceRef, password, capturedBy, capturedByName, taxes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    r.id || Date.now().toString() + Math.random().toString(36).substring(2, 5),
                    r.businessName || '',
                    r.businessAddress || '',
                    r.lga || '',
                    r.areaClass || '',
                    r.lineOfBusiness || '',
                    r.contactPerson || '',
                    r.addressCp || '',
                    r.phoneNumber || '',
                    r.status || 'Pending',
                    r.assignedTax || '',
                    r.chargeRate || '',
                    r.origin || 'Admin',
                    r.invoiceRef,
                    pwd,
                    r.capturedBy || null,
                    r.capturedByName || null,
                    taxesStr
                ]
            );

            // Trigger Registration SMS for each new record
            if (r.phoneNumber) {
                const hostUrl = req.protocol + '://' + req.get('host');
                const msg = `LGA RevMax: Welcome ${r.businessName}! Your Invoice Ref is ${r.invoiceRef}. Total taxes assigned: ${r.taxes ? r.taxes.length : 0}. Access portal at: ${hostUrl}/portal.html`;
                smsHelper.send(r.phoneNumber, msg, 'Registration');
            }
        }

        res.json({ success: true, message: 'Revenues added', added: processedRevenues.length, added_ref: processedRevenues[0]?.invoiceRef });
    } catch (error) {
        console.error('Error saving revenues:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/revenues/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const updatedRecord = req.body;
        
        // Fetch existing record first
        const existing = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        const taxesStr = updatedRecord.taxes ? JSON.stringify(updatedRecord.taxes) : existing.taxes;
        
        let pwd = updatedRecord.password;
        if (pwd && !pwd.startsWith('$2b$')) {
            pwd = bcrypt.hashSync(pwd, 10);
        } else if (pwd === undefined) {
            pwd = existing.password;
        }

        // Update in SQLite
        await dbQuery.run(
            `UPDATE revenues SET 
                businessName = ?, 
                businessAddress = ?, 
                lga = ?, 
                areaClass = ?, 
                lineOfBusiness = ?, 
                contactPerson = ?, 
                addressCp = ?, 
                phoneNumber = ?, 
                status = ?, 
                assignedTax = ?, 
                chargeRate = ?, 
                origin = ?, 
                invoiceRef = ?, 
                password = ?, 
                capturedBy = ?, 
                capturedByName = ?, 
                taxes = ? 
            WHERE id = ?`,
            [
                updatedRecord.businessName !== undefined ? updatedRecord.businessName : existing.businessName,
                updatedRecord.businessAddress !== undefined ? updatedRecord.businessAddress : existing.businessAddress,
                updatedRecord.lga !== undefined ? updatedRecord.lga : existing.lga,
                updatedRecord.areaClass !== undefined ? updatedRecord.areaClass : existing.areaClass,
                updatedRecord.lineOfBusiness !== undefined ? updatedRecord.lineOfBusiness : existing.lineOfBusiness,
                updatedRecord.contactPerson !== undefined ? updatedRecord.contactPerson : existing.contactPerson,
                updatedRecord.addressCp !== undefined ? updatedRecord.addressCp : existing.addressCp,
                updatedRecord.phoneNumber !== undefined ? updatedRecord.phoneNumber : existing.phoneNumber,
                updatedRecord.status !== undefined ? updatedRecord.status : existing.status,
                updatedRecord.assignedTax !== undefined ? updatedRecord.assignedTax : existing.assignedTax,
                updatedRecord.chargeRate !== undefined ? updatedRecord.chargeRate : existing.chargeRate,
                updatedRecord.origin !== undefined ? updatedRecord.origin : existing.origin,
                updatedRecord.invoiceRef !== undefined ? updatedRecord.invoiceRef : existing.invoiceRef,
                pwd,
                updatedRecord.capturedBy || existing.capturedBy,
                updatedRecord.capturedByName || existing.capturedByName,
                taxesStr,
                id
            ]
        );

        const record = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [id]);
        if (record) {
            record.taxes = JSON.parse(record.taxes);
        }
        res.json({ success: true, message: 'Revenue record updated', record });
    } catch (error) {
        console.error('Error updating revenue:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/revenues/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await dbQuery.run('DELETE FROM revenues WHERE id = ?', [id]);
        if (result.changes > 0) {
            res.json({ success: true, message: 'Revenue record deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (error) {
        console.error('Error deleting revenue:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Users API ---
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await dbQuery.all('SELECT * FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    try {
        const u = req.body;
        if (!u.id) u.id = Date.now().toString();
        
        let pwd = u.password || 'password123';
        if (pwd && !pwd.startsWith('$2b$')) {
            pwd = bcrypt.hashSync(pwd, 10);
        }

        await dbQuery.run(
            `INSERT INTO users (id, name, username, email, password, role, lga, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.name || '', u.username || '', u.email || '', pwd, u.role || 'Revenue Officer', u.lga || '', u.status || 'Active']
        );
        res.json({ message: 'User added', user: { ...u, password: pwd } });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        if (id === '1') {
            return res.status(403).json({ message: 'Cannot delete Super Admin' });
        }
        const result = await dbQuery.run('DELETE FROM users WHERE id = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'User deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Payments API (Paystack Integration) ---
app.post('/api/payments/verify/:reference', async (req, res) => {
    const reference = req.params.reference;
    const payerId = req.query.id;
    const taxId = req.query.taxId;
    
    // Use runtime config if set, otherwise fall back to env/placeholder
    const PAYSTACK_SECRET_KEY = runtimeConfig.paystackSecretKey || 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    
    try {
        // --- Simulation Mode Bypass ---
        if (reference.startsWith('SIM-')) {
            console.log('Simulating successful payment for:', reference);
            const payer = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [payerId]);
            
            if (payer) {
                const taxes = payer.taxes ? JSON.parse(payer.taxes) : [];
                const taxIndex = taxes.findIndex(tx => tx.id === taxId);
                
                if (taxIndex !== -1) {
                    const paidAmount = parseFloat(req.query.amount) || taxes[taxIndex].amount;
                    taxes[taxIndex].status = 'Paid';
                    taxes[taxIndex].paymentReference = reference;
                    taxes[taxIndex].paymentDate = new Date().toISOString();
                    taxes[taxIndex].amountPaid = paidAmount;
                    
                    if (taxes[taxIndex].amount <= 0) {
                        taxes[taxIndex].amount = paidAmount;
                    }
                    
                    const allPaid = taxes.every(tx => tx.status === 'Paid' || tx.amount <= 0);
                    const globalStatus = allPaid ? 'Paid' : 'Partial';
                    
                    const taxesStr = JSON.stringify(taxes);
                    await dbQuery.run(
                        'UPDATE revenues SET status = ?, taxes = ? WHERE id = ?',
                        [globalStatus, taxesStr, payerId]
                    );
                    
                    const updatedPayer = { ...payer, status: globalStatus, taxes };
                    delete updatedPayer.password;

                    // Trigger Payment SMS (Simulation)
                    if (payer.phoneNumber) {
                        const tax = taxes[taxIndex];
                        const msg = `LGA RevMax: Payment confirmed! ₦${tax.amountPaid.toLocaleString()} for ${tax.name}. Ref: ${reference}. Thank you for your contribution to ${payer.lga} LGA.`;
                        smsHelper.send(payer.phoneNumber, msg, 'Payment');
                    }

                    return res.json({ success: true, message: 'SIMULATION: Tax payment verified', payer: updatedPayer });
                }
            }
            return res.status(404).json({ success: false, message: 'Simulation target not found' });
        }

        // Live Paystack Verification
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });
        const data = response.data.data;
        
        if (data.status === 'success') {
            const payer = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [payerId]);
            
            if (payer) {
                const taxes = payer.taxes ? JSON.parse(payer.taxes) : [];
                const taxIndex = taxes.findIndex(tx => tx.id === taxId);
                
                if (taxIndex !== -1) {
                    taxes[taxIndex].status = 'Paid';
                    taxes[taxIndex].paymentReference = reference;
                    taxes[taxIndex].paymentDate = new Date().toISOString();
                    taxes[taxIndex].amountPaid = data.amount / 100;
                    
                    const allPaid = taxes.every(tx => tx.status === 'Paid' || tx.amount <= 0);
                    const globalStatus = allPaid ? 'Paid' : 'Partial';
                    
                    const taxesStr = JSON.stringify(taxes);
                    await dbQuery.run(
                        'UPDATE revenues SET status = ?, taxes = ? WHERE id = ?',
                        [globalStatus, taxesStr, payerId]
                    );
                    
                    const updatedPayer = { ...payer, status: globalStatus, taxes };
                    delete updatedPayer.password;

                    // Trigger Payment SMS (Live)
                    if (payer.phoneNumber) {
                        const tax = taxes[taxIndex];
                        const msg = `LGA RevMax: Payment confirmed! ₦${tax.amountPaid.toLocaleString()} for ${tax.name}. Ref: ${reference}. Thank you for your contribution to ${payer.lga} LGA.`;
                        smsHelper.send(payer.phoneNumber, msg, 'Payment');
                    }

                    res.json({ success: true, message: 'Tax payment verified', payer: updatedPayer });
                } else {
                    res.status(404).json({ success: false, message: 'Tax item not found in payer profile' });
                }
            } else {
                res.status(404).json({ success: false, message: 'Tax payer profile not found' });
            }
        } else {
            res.status(400).json({ success: false, message: `Payment failed: ${data.gateway_response}` });
        }
    } catch (error) {
        console.error('Paystack verification error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error communicating with Paystack API',
            error: error.response ? error.response.data.message : error.message 
        });
    }
});

// --- Manual Payments API ---
app.post('/api/payments/submit-manual', async (req, res) => {
    try {
        const { id, taxId, paymentMethod, reference, depositorName, amount } = req.body;
        if (!id || !taxId || !paymentMethod || !reference) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }

        const payer = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [id]);

        if (payer) {
            const taxes = payer.taxes ? JSON.parse(payer.taxes) : [];
            const taxIndex = taxes.findIndex(tx => tx.id === taxId);

            if (taxIndex !== -1) {
                // Update specific tax item
                taxes[taxIndex].status = 'Pending Verification';
                taxes[taxIndex].manualMethod = paymentMethod;
                taxes[taxIndex].manualReference = reference;
                taxes[taxIndex].manualDepositor = depositorName || '';
                taxes[taxIndex].manualAmount = parseFloat(amount) || taxes[taxIndex].amount;
                taxes[taxIndex].manualSubmissionDate = new Date().toISOString();

                // Overall taxpayer status update
                const allPaid = taxes.every(tx => tx.status === 'Paid' || tx.amount <= 0);
                let globalStatus = 'Partial';
                if (allPaid) {
                    globalStatus = 'Paid';
                } else {
                    const hasPendingVerification = taxes.some(tx => tx.status === 'Pending Verification');
                    globalStatus = hasPendingVerification ? 'Pending Verification' : 'Partial';
                }

                const taxesStr = JSON.stringify(taxes);
                await dbQuery.run(
                    'UPDATE revenues SET status = ?, taxes = ? WHERE id = ?',
                    [globalStatus, taxesStr, id]
                );

                const updatedPayer = { ...payer, status: globalStatus, taxes };
                delete updatedPayer.password;

                // Simulated SMS
                if (payer.phoneNumber) {
                    const msg = `LGA RevMax: Payment details uploaded for ${taxes[taxIndex].name}. Method: ${paymentMethod}. Reference: ${reference}. Undergoing audit verification.`;
                    smsHelper.send(payer.phoneNumber, msg, 'Payment Upload');
                }

                return res.json({ success: true, message: 'Manual payment submitted for audit', payer: updatedPayer });
            } else {
                return res.status(404).json({ success: false, message: 'Tax item not found in payer profile' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Payer profile not found' });
        }
    } catch (error) {
        console.error('Error submitting manual payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/payments/verify-manual', async (req, res) => {
    try {
        const { id, taxId, action } = req.body;
        if (!id || !taxId || !action) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        const payer = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [id]);

        if (payer) {
            const taxes = payer.taxes ? JSON.parse(payer.taxes) : [];
            const taxIndex = taxes.findIndex(tx => tx.id === taxId);

            if (taxIndex !== -1) {
                const taxItem = taxes[taxIndex];

                if (action === 'approve') {
                    // Confirm payment
                    taxItem.status = 'Paid';
                    taxItem.paymentReference = taxItem.manualReference || `MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                    taxItem.paymentDate = new Date().toISOString();
                    taxItem.amountPaid = taxItem.manualAmount || taxItem.amount;

                    // Trigger official confirmation SMS
                    if (payer.phoneNumber) {
                        const msg = `LGA RevMax: Payment confirmed! ₦${taxItem.amountPaid.toLocaleString()} verified for ${taxItem.name} via ${taxItem.manualMethod || 'Manual'}. Receipt Ref: ${taxItem.paymentReference}. Thank you!`;
                        smsHelper.send(payer.phoneNumber, msg, 'Payment');
                    }
                } else if (action === 'reject') {
                    // Reject payment and reset back to Pending
                    taxItem.status = 'Pending';
                    const rejectedRef = taxItem.manualReference;
                    
                    // Clear manual verification tags
                    delete taxItem.manualMethod;
                    delete taxItem.manualReference;
                    delete taxItem.manualDepositor;
                    delete taxItem.manualAmount;
                    delete taxItem.manualSubmissionDate;

                    if (payer.phoneNumber) {
                        const msg = `LGA RevMax: Payment audit failed for ${taxItem.name}. Reference ${rejectedRef} could not be verified in our records. Please contact support.`;
                        smsHelper.send(payer.phoneNumber, msg, 'Payment Rejection');
                    }
                }

                // Recalculate global status
                const allPaid = taxes.every(tx => tx.status === 'Paid' || tx.amount <= 0);
                let globalStatus = 'Pending';
                if (allPaid) {
                    globalStatus = 'Paid';
                } else {
                    const hasPendingVerification = taxes.some(tx => tx.status === 'Pending Verification');
                    const hasPaid = taxes.some(tx => tx.status === 'Paid');
                    if (hasPendingVerification) {
                        globalStatus = 'Pending Verification';
                    } else if (hasPaid) {
                        globalStatus = 'Partial';
                    } else {
                        globalStatus = 'Pending';
                    }
                }

                const taxesStr = JSON.stringify(taxes);
                await dbQuery.run(
                    'UPDATE revenues SET status = ?, taxes = ? WHERE id = ?',
                    [globalStatus, taxesStr, id]
                );

                const updatedPayer = { ...payer, status: globalStatus, taxes };
                delete updatedPayer.password;

                return res.json({ success: true, message: `Payment audit ${action}d successfully`, payer: updatedPayer });
            } else {
                return res.status(404).json({ success: false, message: 'Tax item not found in profile' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Payer profile not found' });
        }
    } catch (error) {
        console.error('Error verifying manual payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
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
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await dbQuery.get('SELECT * FROM users WHERE username = ?', [username]);
        
        if (user && bcrypt.compareSync(password, user.password)) {
            // Generate secure JWT
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role, lga: user.lga },
                JWT_SECRET,
                { expiresIn: '8h' }
            );
            res.json({ success: true, user, token });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/payer/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        const payer = await dbQuery.get('SELECT * FROM revenues WHERE phoneNumber = ? OR invoiceRef = ?', [identifier, identifier]);

        if (payer) {
            // Check password. Legacy fallback: if no password field, use phoneNumber.
            const storedPasswordHash = payer.password;
            let isMatch = false;

            if (storedPasswordHash) {
                if (storedPasswordHash.startsWith('$2b$')) {
                    isMatch = bcrypt.compareSync(password, storedPasswordHash);
                } else {
                    isMatch = (password === storedPasswordHash);
                }
            } else {
                isMatch = (password === payer.phoneNumber);
            }

            if (isMatch) {
                // Generate Payer JWT
                const token = jwt.sign(
                    { id: payer.id, phone: payer.phoneNumber, role: 'Payer' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                // Strip password and parse taxes
                const payerSafe = { ...payer };
                delete payerSafe.password;
                payerSafe.taxes = payerSafe.taxes ? JSON.parse(payerSafe.taxes) : [];

                res.json({ success: true, payer: payerSafe, token });
            } else {
                res.status(401).json({ success: false, message: 'Invalid identifier or password' });
            }
        } else {
            res.status(404).json({ success: false, message: 'Taxpayer profile not found. Please register.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/payer/profile', authenticateToken, async (req, res) => {
    try {
        const payerId = req.query.id;
        if (!payerId) return res.status(400).json({ success: false, message: 'Missing payer ID' });

        // RBAC: Payer can only request their own profile. Admins can request any.
        if (req.user.role === 'Payer' && req.user.id !== payerId) {
            return res.status(403).json({ success: false, message: 'Access Denied: Forbidden Request' });
        }

        const payer = await dbQuery.get('SELECT * FROM revenues WHERE id = ?', [payerId]);

        if (payer) {
            const payerSafe = { ...payer };
            delete payerSafe.password;
            payerSafe.taxes = payerSafe.taxes ? JSON.parse(payerSafe.taxes) : [];
            res.json({ success: true, payer: payerSafe });
        } else {
            res.status(404).json({ success: false, message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});// --- Public Verification API ---
app.get('/api/verify', async (req, res) => {
    try {
        const ref = req.query.ref;
        if (!ref) {
            return res.status(400).json({ success: false, message: 'Missing reference code' });
        }

        console.log(`[Public API] Verification request for reference: ${ref}`);

        // Search by invoiceRef or within taxes JSON string
        const matchedPayer = await dbQuery.get(
            `SELECT * FROM revenues WHERE invoiceRef = ? OR taxes LIKE ?`,
            [ref, `%${ref}%`]
        );

        if (matchedPayer) {
            const taxes = matchedPayer.taxes ? JSON.parse(matchedPayer.taxes) : [];
            
            // Check if we matched a specific tax item's paymentReference or manualReference
            let matchedTax = taxes.find(t => t.paymentReference === ref || t.manualReference === ref || t.id === ref);
            
            // If we didn't match a specific tax item (e.g. overall invoiceRef), return all taxes
            if (!matchedTax && matchedPayer.invoiceRef === ref) {
                const payerSafe = { ...matchedPayer };
                delete payerSafe.password;
                payerSafe.taxes = taxes;
                return res.json({
                    success: true,
                    type: 'Invoice',
                    status: matchedPayer.status,
                    payer: payerSafe
                });
            }

            if (matchedTax) {
                const payerSafe = { ...matchedPayer };
                delete payerSafe.password;
                delete payerSafe.taxes;
                
                return res.json({
                    success: true,
                    type: 'Receipt',
                    status: matchedTax.status,
                    tax: matchedTax,
                    payer: payerSafe
                });
            }
        }

        res.status(404).json({ success: false, message: 'Invalid reference number. Record not found.' });
    } catch (err) {
        console.error('[Verification API Error]', err);
        res.status(500).json({ success: false, message: 'Server error during verification lookup' });
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
app.get('/api/health', async (req, res) => {
    try {
        const dbOnline = await dbQuery.get('SELECT 1 as checkOk');
        res.json({ 
            status: 'online', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage().rss,
            database: {
                engine: 'SQLite3',
                connected: dbOnline.checkOk === 1
            }
        });
    } catch (err) {
        res.json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            error: err.message
        });
    }
});

// --- Notifications API ---
app.get('/api/notifications', async (req, res) => {
    try {
        const logs = await smsHelper.getLogs();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Grievances API ---
// GET all grievances (with optional LGA filter)
app.get('/api/grievances', async (req, res) => {
    try {
        let query = 'SELECT * FROM grievances';
        const params = [];
        if (req.query.lga && req.query.lga !== 'System-wide') {
            query += ' WHERE lga = ?';
            params.push(req.query.lga);
        }
        query += ' ORDER BY datetime(submittedAt) DESC';
        
        const grievances = await dbQuery.all(query, params);
        res.json(grievances);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET single grievance by reference code
app.get('/api/grievances/:ref', async (req, res) => {
    try {
        const ref = decodeURIComponent(req.params.ref);
        const found = await dbQuery.get('SELECT * FROM grievances WHERE ref = ? OR id = ?', [ref, ref]);
        if (found) {
            res.json(found);
        } else {
            res.status(404).json({ success: false, message: 'Grievance not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST new grievance
app.post('/api/grievances', async (req, res) => {
    try {
        const g = req.body;
        if (!g.name || !g.lga || !g.subject || !g.description) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        g.id = g.id || Date.now().toString();
        g.submittedAt = g.submittedAt || new Date().toISOString();
        g.status = 'Pending';
        
        await dbQuery.run(
            `INSERT INTO grievances (id, ref, name, lga, subject, description, submittedAt, status, officialResponse, responderName, responseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [g.id, g.ref, g.name, g.lga, g.subject, g.description, g.submittedAt, g.status, g.officialResponse || '', g.responderName || '', g.responseDate || '']
        );
        console.log(`[Grievances] New submission: ${g.ref} from ${g.name} (${g.lga})`);
        res.json({ success: true, message: 'Grievance submitted', ref: g.ref });
    } catch (err) {
        console.error('Error saving grievance:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update grievance status / response (admin)
app.put('/api/grievances/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const update = req.body;
        const existing = await dbQuery.get('SELECT * FROM grievances WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Grievance not found' });
        
        await dbQuery.run(
            `UPDATE grievances SET 
                status = ?, 
                officialResponse = ?, 
                responderName = ?, 
                responseDate = ? 
            WHERE id = ?`,
            [
                update.status !== undefined ? update.status : existing.status,
                update.officialResponse !== undefined ? update.officialResponse : existing.officialResponse,
                update.responderName !== undefined ? update.responderName : existing.responderName,
                update.responseDate !== undefined ? update.responseDate : existing.responseDate,
                id
            ]
        );
        
        const updated = await dbQuery.get('SELECT * FROM grievances WHERE id = ?', [id]);
        res.json({ success: true, message: 'Grievance updated', grievance: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE grievance (admin only, hard delete)
app.delete('/api/grievances/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await dbQuery.run('DELETE FROM grievances WHERE id = ?', [id]);
        if (result.changes > 0) {
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
