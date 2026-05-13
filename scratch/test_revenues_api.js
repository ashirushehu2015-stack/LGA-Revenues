const http = require('http');

const postData = JSON.stringify({
    id: 'test-rev-node',
    businessName: 'Node Test Business',
    businessAddress: '456 Node St',
    lga: 'Kaura Namoda',
    areaClass: 'semiUrban',
    lineOfBusiness: 'Software',
    contactPerson: 'Node User',
    addressCp: 'Node Home',
    phoneNumber: '1112223333',
    status: 'Active',
    assignedTax: 'Tenement Rates - Commercial',
    chargeRate: '₦5,000'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/revenues',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
