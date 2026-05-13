const fs = require('fs');
const path = require('path');

const revenuesFile = path.join(__dirname, '..', 'data', 'revenues.json');
const revenues = JSON.parse(fs.readFileSync(revenuesFile, 'utf8'));

// Generate 30 days of data
const lgas = ["Anka", "Bakura", "Bukkuyum", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Talata Mafara", "Tsafe", "Zurmi"];
const now = new Date();

for (let i = 20; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Add 1-3 records per day
    const count = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < count; j++) {
        const id = date.getTime() + Math.floor(Math.random() * 1000);
        const lga = lgas[Math.floor(Math.random() * lgas.length)];
        const amount = Math.floor(Math.random() * 50000) + 5000;
        const isPaid = Math.random() > 0.3;
        
        const newRecord = {
            id: id.toString(),
            businessName: `Historical Business ${id.toString().slice(-4)}`,
            businessAddress: `${Math.floor(Math.random() * 100)} Market Road`,
            lga: lga,
            areaClass: Math.random() > 0.5 ? 'urban' : 'semiUrban',
            lineOfBusiness: "Retail",
            contactPerson: "Historical Owner",
            phoneNumber: "08000000000",
            status: isPaid ? "Paid" : "Active",
            origin: "Admin",
            taxes: [
                {
                    id: `tax-${id}-1`,
                    name: "Tenement Rates - Commercial",
                    amount: amount,
                    rateType: "Flat",
                    duration: "Yearly",
                    status: isPaid ? "Paid" : "Pending",
                    paymentDate: isPaid ? date.toISOString() : null,
                    amountPaid: isPaid ? amount : 0
                }
            ],
            invoiceRef: `LGA/REV/${date.getFullYear()}/HIST-${id.toString().slice(-4)}`
        };
        revenues.push(newRecord);
    }
}

fs.writeFileSync(revenuesFile, JSON.stringify(revenues, null, 2));
console.log("Backfilled 21 days of historical data.");
