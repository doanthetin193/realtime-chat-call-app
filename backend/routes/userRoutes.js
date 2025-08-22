const express = require('express');
const {getMe, updateProfile, searchUsers, getOnlineUsers, setClassLeader} = require("../controllers/userController");
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.get("/search", authMiddleware, searchUsers);
router.get("/online", authMiddleware, getOnlineUsers);
router.put("/:userId/set-leader", authMiddleware, setClassLeader);

module.exports = router;