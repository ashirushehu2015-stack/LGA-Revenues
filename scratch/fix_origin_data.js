const fs = require('fs');
const path = require('path');

// Go up one level from scratch/ to find data/
const filePath = path.join(__dirname, '..', 'data', 'revenues.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updatedCount = 0;

    data.forEach(record => {
        if (!record.origin) {
            record.origin = 'Admin';
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Successfully updated ${updatedCount} records to 'Admin' origin.`);
    } else {
        console.log('No records needed updating.');
    }
} catch (err) {
    console.error('Error updating data:', err.message);
}
