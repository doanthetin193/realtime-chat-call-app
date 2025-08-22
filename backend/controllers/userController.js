const User = require('../models/User');

const getMe = async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-passwordHash");
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { username, avatarUrl } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { 
                ...(username && { username }),
                ...(avatarUrl && { avatarUrl })
            },
            { new: true }
        ).select('-passwordHash');
        
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        let searchCondition = { _id: { $ne: req.user.id } }; // Exclude current user
        
        // If query is provided, add search criteria
        if (query && query.trim()) {
            searchCondition.$or = [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }
        
        const users = await User.find(searchCondition)
            .select('username email avatarUrl isOnline lastSeen')
            .limit(50); // Increased limit for showing all users
        
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOnlineUsers = async (req, res) => {
    try {
        const onlineUsers = await User.find({ isOnline: true })
            .select('username email avatarUrl')
            .limit(50);
        
        res.status(200).json(onlineUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const setClassLeader = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isClassLeader: true },
      { new: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMe, updateProfile, searchUsers, getOnlineUsers, setClassLeader };