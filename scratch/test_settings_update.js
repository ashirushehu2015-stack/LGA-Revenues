const axios = require('axios');

async function testSettingsUpdate() {
    try {
        // Update keys
        const updateRes = await axios.post('http://localhost:3000/api/settings/paystack', {
            secretKey: 'sk_test_verified_secret_key',
            publicKey: 'pk_test_verified_dynamic_key',
            mode: 'test'
        });
        console.log('Update Success:', updateRes.data.success);

        // Fetch back
        const fetchRes = await axios.get('http://localhost:3000/api/settings');
        console.log('Fetched Settings:', fetchRes.data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testSettingsUpdate();
