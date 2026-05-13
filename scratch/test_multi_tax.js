const http = require('http');

const postData = JSON.stringify({
    id: 'multi-tax-test',
    businessName: 'Multi Tax Corp',
    businessAddress: '789 Alignment Way',
    lga: 'Gusau',
    areaClass: 'urban',
    lineOfBusiness: 'Multi-Services',
    contactPerson: 'Aligner Jones',
    addressCp: 'Alignment HQ',
    phoneNumber: '9998887777',
    status: 'Active',
    taxes: [
        {
            id: 't1',
            name: 'Tenement Rates - Private',
            amount: 5000,
            rateType: 'Flat',
            duration: 'Yearly',
            status: 'Paid'
        },
        {
            id: 't2',
            name: 'Communication Mast',
            amount: 20000,
            rateType: 'Flat',
            duration: 'Yearly',
            status: 'Pending'
        },
        {
            id: 't3',
            name: 'Filling Stations',
            amount: 15000,
            rateType: 'Flat',
            duration: 'Yearly',
            status: 'Pending'
        }
    ]
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
