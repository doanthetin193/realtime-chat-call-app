const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    avatarUrl: {
        type: String,
        default:""
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    socketId: {
        type: String,
        default: ""
    },
    isClassLeader: {
        type: Boolean,
        default: false
    }},
    {timestamps: true});

const User = mongoose.model("User", userSchema);
module.exports = User;
