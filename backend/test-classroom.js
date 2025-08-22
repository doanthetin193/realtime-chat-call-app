const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testClassroomChat() {
  console.log('🧪 Testing Classroom Chat Functionality...\n');

  try {
    // 1. Tạo user leader
    console.log('1. Creating leader user...');
    const timestamp = Date.now();
    const leaderData = {
      email: `leader${timestamp}@test.com`,
      username: `Leader ${timestamp}`,
      password: '123456'
    };
    const leaderRes = await axios.post(`${API_BASE}/auth/register`, leaderData);
    console.log('✅ Leader created:', leaderRes.data.user.username);
    
    // Set làm class leader
    await axios.put(`${API_BASE}/user/${leaderRes.data.user.id}/set-leader`, {}, {
      headers: { Authorization: `Bearer ${leaderRes.data.token}` }
    });
    console.log('✅ Leader privileges granted');

    // 2. Tạo user member
    console.log('\n2. Creating member users...');
    const members = [];
    for (let i = 1; i <= 3; i++) {
      const memberData = {
        email: `member${i}${timestamp}@test.com`,
        username: `Member ${i}`,
        password: '123456'
      };
      const memberRes = await axios.post(`${API_BASE}/auth/register`, memberData);
      members.push(memberRes.data);
      console.log(`✅ Member ${i} created:`, memberRes.data.user.username);
    }

    // 3. Leader tạo classroom
    console.log('\n3. Creating classroom...');
    const classroomData = {
      name: 'Lớp Học Thử Nghiệm',
      memberIds: members.map(m => m.user.id)
    };
    const classroomRes = await axios.post(`${API_BASE}/classrooms`, classroomData, {
      headers: { Authorization: `Bearer ${leaderRes.data.token}` }
    });
    console.log('✅ Classroom created:', classroomRes.data.name);
    console.log('   Members count:', classroomRes.data.members.length);

    // 4. Members join classroom
    console.log('\n4. Members joining classroom...');
    for (const member of members) {
      await axios.post(`${API_BASE}/classrooms/${classroomRes.data._id}/join`, {}, {
        headers: { Authorization: `Bearer ${member.token}` }
      });
      console.log(`✅ ${member.user.username} joined classroom`);
    }

    // 5. Test sending messages
    console.log('\n5. Testing classroom chat...');
    const conversationId = classroomRes.data.conversation._id;
    
    // Leader gửi tin nhắn welcome
    const welcomeMsg = await axios.post(`${API_BASE}/messages`, {
      conversationId,
      content: 'Chào mọi người! Chào mừng đến lớp học của chúng ta! 🎉',
      type: 'text'
    }, {
      headers: { Authorization: `Bearer ${leaderRes.data.token}` }
    });
    console.log('✅ Leader sent welcome message');

    // Members reply
    for (let i = 0; i < members.length; i++) {
      const message = `Chào thầy/cô! Em là ${members[i].user.username} ạ! 👋`;
      await axios.post(`${API_BASE}/messages`, {
        conversationId,
        content: message,
        type: 'text'
      }, {
        headers: { Authorization: `Bearer ${members[i].token}` }
      });
      console.log(`✅ ${members[i].user.username} replied`);
    }

    // 6. Fetch messages để verify
    console.log('\n6. Fetching messages...');
    const messagesRes = await axios.get(`${API_BASE}/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${leaderRes.data.token}` }
    });
    console.log(`✅ ${messagesRes.data.length} messages in classroom chat`);

    console.log('\n🎉 All tests passed! Classroom chat is working properly!');
    console.log('\n📋 Test Summary:');
    console.log(`   - Leader: ${leaderData.email} / ${leaderData.password}`);
    console.log(`   - Members: ${members.length} users`);
    console.log(`   - Classroom: "${classroomData.name}"`);
    console.log(`   - Messages: ${messagesRes.data.length} total`);
    console.log('\n🌐 Now you can login with these accounts at http://localhost:5173');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

// Run test
testClassroomChat();
