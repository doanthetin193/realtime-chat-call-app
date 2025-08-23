const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Classroom = require('../models/Classroom');

async function resetDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🗑️  Deleting all data...');

        // Xóa theo thứ tự để tránh lỗi foreign key
        console.log('   - Deleting Messages...');
        const messagesDeleted = await Message.deleteMany({});
        console.log(`   ✅ Deleted ${messagesDeleted.deletedCount} messages`);

        console.log('   - Deleting Conversations...');
        const conversationsDeleted = await Conversation.deleteMany({});
        console.log(`   ✅ Deleted ${conversationsDeleted.deletedCount} conversations`);

        console.log('   - Deleting Classrooms...');
        const classroomsDeleted = await Classroom.deleteMany({});
        console.log(`   ✅ Deleted ${classroomsDeleted.deletedCount} classrooms`);

        console.log('   - Deleting Users...');
        const usersDeleted = await User.deleteMany({});
        console.log(`   ✅ Deleted ${usersDeleted.deletedCount} users`);

        console.log('\n🎉 Database reset completed!');
        console.log('📊 Summary:');
        console.log(`   - Users: ${usersDeleted.deletedCount}`);
        console.log(`   - Classrooms: ${classroomsDeleted.deletedCount}`);
        console.log(`   - Conversations: ${conversationsDeleted.deletedCount}`);
        console.log(`   - Messages: ${messagesDeleted.deletedCount}`);
        console.log('\n✨ Database is now clean and ready for testing!');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Confirm before running
console.log('⚠️  WARNING: This will delete ALL data in your database!');
console.log('📍 Database:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');

setTimeout(() => {
    resetDatabase();
}, 5000);
