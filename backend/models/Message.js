const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content:{
        type: String
    },
    type:{
        type: String,
        enum: ['text', 'image', 'emoji'],
        default: 'text'
    },
    mediaUrl:{
        type: String,
        default: ""
    },
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {timestamps: true});

module.exports = mongoose.model('Message', messageSchema);