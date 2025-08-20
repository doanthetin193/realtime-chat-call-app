const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    isGroup:{
        type: Boolean,
        default: false
    },
    name:{
        type: String
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
