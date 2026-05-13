const axios = require('axios');

async function testPortalRegistration() {
    const newPayer = {
        id: "portal_test_" + Date.now(),
        businessName: "LGA Tech Hub",
        businessAddress: "No 1 Digital Way",
        lga: "Anka",
        lineOfBusiness: "ICT Services",
        contactPerson: "Aliyu Digital",
        addressCp: "No 1 Digital Way",
        phoneNumber: "08012345678",
        status: "Active",
        origin: "Portal",
        taxes: [
            { id: "tx-123", name: "Computer Institute shop fees", amount: 10000, rateType: "Flat", duration: "Yearly", status: "Pending" }
        ]
    };

    try {
        const res = await axios.post('http://localhost:3000/api/revenues', newPayer);
        console.log('Registration Success:', res.data.success);
        console.log('Reference:', res.data.added_ref);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testPortalRegistration();
