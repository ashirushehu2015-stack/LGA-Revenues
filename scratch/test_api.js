const http = require('http');

const postData = JSON.stringify({
    id: 'test-user-node',
    name: 'Node Test User',
    email: 'node@test.com',
    role: 'LGA Admin',
    lga: 'Gusau',
    status: 'Active'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
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
