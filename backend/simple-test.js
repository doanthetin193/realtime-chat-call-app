const http = require('http');

// Simple test function
function testEndpoint() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ Server response:', data);
            console.log('✅ Status code:', res.statusCode);
        });
    });

    req.on('error', (err) => {
        console.error('❌ Request error:', err.message);
    });

    req.end();
}

console.log('🧪 Testing basic endpoint...');
testEndpoint();
