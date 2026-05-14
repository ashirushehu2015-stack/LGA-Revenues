const axios = require('axios');

async function testApi() {
    try {
        const res = await axios.get('http://localhost:3000/api/revenues?lga=Anka');
        console.log('Anka Revenues:', res.data.length);
        if (res.data.length > 0) {
            console.log('First Record LGA:', res.data[0].lga);
        } else {
            // Get all to see what's there
            const allRes = await axios.get('http://localhost:3000/api/revenues');
            console.log('Total Revenues:', allRes.data.length);
            const lgas = [...new Set(allRes.data.map(r => r.lga))];
            console.log('Available LGAs:', lgas);
        }
    } catch (e) {
        console.error('API Error:', e.message);
    }
}

testApi();
