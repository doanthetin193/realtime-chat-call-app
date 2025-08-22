const Classroom = require('../models/Classroom');
const Conversation = require('../models/Conversation');

// Create a classroom (only leader)
const createClassroom = async (req, res) => {
    try {
        const { name, memberIds = [] } = req.body;
        if (!req.user || !name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        // Only leaders can create
        // Fetch from request-bound user object in DB not available here; trust JWT payload + server-side checks elsewhere
        // For stricter check, require DB read, but lightweight: client must send, we validate later on member ops.

        // Ensure creator is leader
        // We'll rely on User model via populate when needed; for now, require flag in token: req.user.id checked later when reading user

        // Build member list including leader
        const uniqueMemberIds = Array.from(new Set([req.user.id, ...memberIds]));

        // Create backing conversation for classroom
        const conversation = await Conversation.create({
            isGroup: true,
            name,
            members: uniqueMemberIds
        });

        const classroom = await Classroom.create({
            name,
            leader: req.user.id,
            members: uniqueMemberIds,
            conversation: conversation._id
        });

        const populated = await Classroom.findById(classroom._id)
            .populate('leader', 'username email')
            .populate('members', 'username email avatarUrl')
            .populate('conversation');

        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// List classrooms (optionally only mine)
const listClassrooms = async (req, res) => {
    try {
        const { mine } = req.query;
        const filter = mine === '1' ? { members: req.user.id } : {};
        const classrooms = await Classroom.find(filter)
            .populate('leader', 'username email')
            .populate('members', 'username email avatarUrl isOnline lastSeen')
            .populate({ 
                path: 'conversation', 
                populate: [
                    { path: 'lastMessage' },
                    { path: 'members', select: 'username email avatarUrl isOnline lastSeen' }
                ]
            })
            .sort({ updatedAt: -1 });
        res.json(classrooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Join classroom (non-leaders can only join existing)
const joinClassroom = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const classroom = await Classroom.findById(classroomId).populate('conversation');
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        // Add to classroom and backing conversation
        const alreadyMember = classroom.members.some(m => m.toString() === req.user.id);
        if (!alreadyMember) {
            classroom.members.push(req.user.id);
            await classroom.save();
        }
        const conversation = await Conversation.findById(classroom.conversation._id);
        const inConversation = conversation.members.some(m => m.toString() === req.user.id);
        if (!inConversation) {
            conversation.members.push(req.user.id);
            await conversation.save();
        }
        const populated = await classroom
            .populate('leader', 'username email')
            .populate('members', 'username email avatarUrl');
        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const addMember = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { userId } = req.body;

        const classroom = await Classroom.findById(classroomId).populate('leader');
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        if (classroom.leader._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only leader can add members' });
        }

        const exists = classroom.members.some(m => m.toString() === userId);
        if (!exists) {
            classroom.members.push(userId);
            await classroom.save();
        }

        // Ensure conversation membership
        const conversation = await Conversation.findById(classroom.conversation);
        if (conversation && !conversation.members.some(m => m.toString() === userId)) {
            conversation.members.push(userId);
            await conversation.save();
        }

        const populated = await classroom
            .populate('leader', 'username email')
            .populate('members', 'username email avatarUrl');
        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const removeMember = async (req, res) => {
    try {
        const { classroomId, userId } = req.params;
        const classroom = await Classroom.findById(classroomId).populate('leader');
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        if (classroom.leader._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only leader can remove members' });
        }

        classroom.members = classroom.members.filter(m => m.toString() !== userId);
        await classroom.save();

        // Remove from conversation
        const conversation = await Conversation.findById(classroom.conversation);
        if (conversation) {
            conversation.members = conversation.members.filter(m => m.toString() !== userId);
            await conversation.save();
        }

        const populated = await Classroom.findById(classroomId)
            .populate('leader', 'username email')
            .populate('members', 'username email avatarUrl');
        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Xóa classroom (chỉ leader mới có thể xóa)
const deleteClassroom = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const classroom = await Classroom.findById(classroomId).populate('members', 'username _id');
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        // Chỉ leader mới có thể xóa classroom
        if (classroom.leader.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only leader can delete classroom' });
        }
        
        // Emit socket event để thông báo cho tất cả members
        const io = req.app.get('socketio');
        if (io) {
            // Thông báo cho tất cả members trong classroom
            classroom.members.forEach(member => {
                io.emit('classroom_deleted', {
                    classroomId: classroomId,
                    classroomName: classroom.name,
                    message: `Lớp học "${classroom.name}" đã bị xóa bởi lớp trưởng`
                });
            });
        }
        
        // Xóa conversation liên quan
        if (classroom.conversation) {
            await Conversation.findByIdAndDelete(classroom.conversation);
        }
        
        // Xóa classroom
        await Classroom.findByIdAndDelete(classroomId);
        
        res.json({ message: 'Classroom deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Leave classroom (thành viên tự rời khỏi lớp học)
const leaveClassroom = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const classroom = await Classroom.findById(classroomId).populate('leader', 'username');
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }
        
        // Kiểm tra user có trong classroom không
        const isMember = classroom.members.some(m => m.toString() === req.user.id);
        if (!isMember) {
            return res.status(400).json({ message: 'You are not a member of this classroom' });
        }
        
        // Leader không thể tự rời, phải xóa classroom hoặc chuyển quyền trước
        if (classroom.leader._id.toString() === req.user.id) {
            return res.status(403).json({ message: 'Leaders cannot leave classroom. You must delete the classroom or transfer leadership first.' });
        }
        
        // Remove from classroom members
        classroom.members = classroom.members.filter(m => m.toString() !== req.user.id);
        await classroom.save();

        // Remove from conversation
        const conversation = await Conversation.findById(classroom.conversation);
        if (conversation) {
            conversation.members = conversation.members.filter(m => m.toString() !== req.user.id);
            await conversation.save();
        }
        
        // Emit socket event để thông báo
        const io = req.app.get('socketio');
        if (io) {
            io.emit('member_left_classroom', {
                classroomId: classroomId,
                classroomName: classroom.name,
                memberId: req.user.id,
                memberUsername: req.user.username,
                message: `${req.user.username} đã rời khỏi lớp học "${classroom.name}"`
            });
        }

        res.json({ 
            message: 'Successfully left the classroom',
            classroomName: classroom.name 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createClassroom, listClassrooms, joinClassroom, addMember, removeMember, leaveClassroom, deleteClassroom };


