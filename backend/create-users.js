const axios = require('axios');

async function createTestUsers() {
  console.log('🔧 Creating test users for classroom chat...\n');
  
  const API_BASE = 'http://localhost:5000/api';
  const timestamp = Date.now();
  
  try {
    // 1. Tạo leader
    const leaderRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `leader${timestamp}@test.com`,
      username: 'Lớp trưởng',
      password: '123456'
    });
    console.log('✅ Leader created:', leaderRes.data.user);
    
    // Set làm leader
    await axios.put(`${API_BASE}/user/${leaderRes.data.user.id}/set-leader`, {}, {
      headers: { Authorization: `Bearer ${leaderRes.data.token}` }
    });
    console.log('✅ Leader privileges set');
    
    // 2. Tạo members
    const members = [];
    for (let i = 1; i <= 3; i++) {
      const memberRes = await axios.post(`${API_BASE}/auth/register`, {
        email: `member${i}${timestamp}@test.com`, 
        username: `Thành viên ${i}`,
        password: '123456'
      });
      members.push(memberRes.data);
      console.log(`✅ Member ${i} created:`, memberRes.data.user);
    }
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`Leader: ${leaderRes.data.user.email} / 123456`);
    members.forEach((m, i) => {
      console.log(`Member ${i+1}: ${m.user.email} / 123456`);
    });
    console.log('\n🌐 Now you can test at http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createTestUsers();
