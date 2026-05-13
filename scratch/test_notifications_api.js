const axios = require('axios');

async function testApi() {
    try {
        console.log('Checking Server Health...');
        const health = await axios.get('http://localhost:3000/api/health');
        console.log('Health:', health.data);

        console.log('Checking Notifications API...');
        const notifs = await axios.get('http://localhost:3000/api/notifications');
        console.log('Notifications Count:', notifs.data.length);
        console.log('Sample Notification:', notifs.data[0] || 'None');
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

testApi();
