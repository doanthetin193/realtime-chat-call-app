const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
require('dotenv').config();

const register = async(req,res) => {
    try{
        const {email, username, password} = req.body;
        if(!email || !username || !password){
            return res.status(400).json({ message : "All fields required"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({ message: "Email already registered"});
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = await User.create({email,username,passwordHash});
        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '15d' });
        res.status(201).json({ token, user: { id: user._id, email: user.email, username: user.username, isClassLeader: user.isClassLeader } });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

const login = async(req,res) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({ message: "All fields required" });    
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if(!isMatch){
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15d' });
        res.status(200).json({ token, user: { id: user._id, email: user.email, username: user.username, isClassLeader: user.isClassLeader } });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { register, login };