const express = require("express");
const { 
  createConversation, 
  getMyConversations, 
  addMemberToGroup, 
  removeMemberFromGroup,
  updateConversation,
  deleteConversation 
} = require("../controllers/conversationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createConversation);
router.get("/", authMiddleware, getMyConversations);
router.put("/:conversationId", authMiddleware, updateConversation);
router.delete("/:conversationId", authMiddleware, deleteConversation);
router.post("/:conversationId/members", authMiddleware, addMemberToGroup);
router.delete("/:conversationId/members/:userId", authMiddleware, removeMemberFromGroup);

module.exports = router;
