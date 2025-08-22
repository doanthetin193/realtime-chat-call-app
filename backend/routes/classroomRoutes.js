const express = require('express');
const { createClassroom, listClassrooms, joinClassroom, addMember, removeMember } = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// Guard: only leaders can create classroom
const requireLeader = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('isClassLeader');
        if (!user || !user.isClassLeader) {
            return res.status(403).json({ message: 'Only class leaders can create classrooms' });
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

router.post('/', authMiddleware, requireLeader, createClassroom);
router.get('/', authMiddleware, listClassrooms);
router.post('/:classroomId/join', authMiddleware, joinClassroom);
router.post('/:classroomId/members', authMiddleware, requireLeader, addMember);
router.delete('/:classroomId/members/:userId', authMiddleware, requireLeader, removeMember);

module.exports = router;


