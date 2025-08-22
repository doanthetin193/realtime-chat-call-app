const express = require('express');
const { createClassroom, listClassrooms, joinClassroom, addMember, removeMember, leaveClassroom, deleteClassroom } = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Chỉ leader của lớp mới có thể add/remove members
const requireClassroomLeader = async (req, res, next) => {
    try {
        const { classroomId } = req.params;
        const Classroom = require('../models/Classroom');
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        if (classroom.leader.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only classroom leader can manage members' });
        }
        
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bất kỳ user nào cũng có thể tạo classroom và trở thành leader của lớp đó
router.post('/', authMiddleware, createClassroom);
router.get('/', authMiddleware, listClassrooms);
router.post('/:classroomId/join', authMiddleware, joinClassroom);

// Chỉ leader của lớp mới có thể add/remove members hoặc xóa classroom
router.post('/:classroomId/members', authMiddleware, requireClassroomLeader, addMember);
router.delete('/:classroomId/members/:userId', authMiddleware, requireClassroomLeader, removeMember);

// Route để thành viên tự rời khỏi classroom (không cần là leader)
router.post('/:classroomId/leave', authMiddleware, leaveClassroom);

router.delete('/:classroomId', authMiddleware, requireClassroomLeader, deleteClassroom);

module.exports = router;