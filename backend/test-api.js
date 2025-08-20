// Test script để kiểm tra các chức năng đã hoàn thành
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user registration
async function testRegister() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/register`, {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123'
        });
        console.log('✅ Registration test passed:', response.data);
        return response.data.token;
    } catch (error) {
        console.log('❌ Registration test failed:', error.response?.data || error.message);
        return null;
    }
}

// Test user login
async function testLogin() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('✅ Login test passed:', response.data);
        return response.data.token;
    } catch (error) {
        console.log('❌ Login test failed:', error.response?.data || error.message);
        return null;
    }
}

// Test protected route
async function testProtectedRoute(token) {
    try {
        const response = await axios.get(`${BASE_URL}/user/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Protected route test passed:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Protected route test failed:', error.response?.data || error.message);
        return null;
    }
}

// Test conversations
async function testConversations(token, userId) {
    try {
        const response = await axios.post(`${BASE_URL}/conversations`, {
            memberIds: [userId],
            isGroup: false
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Create conversation test passed:', response.data);
        return response.data._id;
    } catch (error) {
        console.log('❌ Create conversation test failed:', error.response?.data || error.message);
        return null;
    }
}

// Test messages
async function testMessages(token, conversationId) {
    try {
        const response = await axios.post(`${BASE_URL}/messages`, {
            conversationId,
            content: 'Hello, this is a test message!',
            type: 'text'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Send message test passed:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Send message test failed:', error.response?.data || error.message);
        return null;
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Starting API tests...\n');
    
    // Test basic endpoint
    try {
        const basicResponse = await axios.get('http://localhost:5000/');
        console.log('✅ Basic endpoint test passed:', basicResponse.data);
    } catch (error) {
        console.log('❌ Basic endpoint test failed:', error.message);
        return;
    }

    // Test registration
    let token = await testRegister();
    if (!token) {
        // Try login if registration fails (user might already exist)
        token = await testLogin();
    }
    
    if (!token) {
        console.log('❌ Cannot get auth token, stopping tests');
        return;
    }
    
    // Test protected route
    const user = await testProtectedRoute(token);
    if (!user) return;
    
    // Test conversation creation
    const conversationId = await testConversations(token, user.id || user._id);
    if (!conversationId) return;
    
    // Test message sending
    await testMessages(token, conversationId);
    
    console.log('\n🎉 All basic API tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
