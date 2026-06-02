"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_service_1 = require("../services/chat.service");
const router = (0, express_1.Router)();
router.post("/message", async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message || message.trim() === "") {
        res.status(400).json({ error: "Message cannot be empty" });
        return;
    }
    const trimmed = message.trim();
    if (trimmed.length > 1000) {
        res.status(400).json({ error: "Message too long. Max 1000 characters." });
        return;
    }
    try {
        const result = await (0, chat_service_1.handleMessage)(sessionId, message.trim());
        res.json(result);
    }
    catch (error) {
        console.error("chat error:", error);
        res.status(500).json({ error: "something went wrong. Please try again." });
    }
});
router.get("/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
    }
    try {
        const messages = await (0, chat_service_1.getHistory)(sessionId);
        res.json({ messages });
    }
    catch (error) {
        console.error("History error:", error);
        res.status(500).json({ error: "could not fetch history." });
    }
});
exports.default = router;
//# sourceMappingURL=chat.routes.js.map