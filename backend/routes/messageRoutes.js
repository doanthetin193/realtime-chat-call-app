const express = require("express");
const { getMessages, sendMessage } = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:conversationId", authMiddleware, getMessages);
router.post("/", authMiddleware, sendMessage);

module.exports = router;
