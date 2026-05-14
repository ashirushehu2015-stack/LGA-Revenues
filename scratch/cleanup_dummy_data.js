const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'revenues.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const originalCount = data.length;

    // Filter out historical dummy records
    const cleanedData = data.filter(record => {
        const name = record.businessName || '';
        return !name.startsWith('Historical Business');
    });

    const removedCount = originalCount - cleanedData.length;

    if (removedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2));
        console.log(`Successfully removed ${removedCount} dummy records.`);
        console.log(`Original data state restored with ${cleanedData.length} records.`);
    } else {
        console.log('No dummy records found to remove.');
    }
} catch (err) {
    console.error('Error cleaning up data:', err.message);
}
