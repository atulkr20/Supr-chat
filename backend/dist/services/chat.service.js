"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
exports.getHistory = getHistory;
const db_1 = __importDefault(require("../db"));
const llm_service_1 = require(".//llm.service");
async function handleMessage(sessionId, text) {
    let conversation;
    if (sessionId) {
        conversation = await db_1.default.conversation.findUnique({
            where: { id: sessionId },
        });
    }
    if (!conversation) {
        conversation = await db_1.default.conversation.create({ data: {} });
    }
    // Fetching past messages for context
    const pastMessages = await db_1.default.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 10,
    });
    // Format history for groq
    const history = pastMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
    }));
    // saviong user message
    await db_1.default.message.create({
        data: {
            conversationId: conversation.id,
            sender: 'user',
            text,
        },
    });
    // get ai reply
    const reply = await (0, llm_service_1.generateReply)(history, text);
    // save ai reply 
    await db_1.default.message.create({
        data: {
            conversationId: conversation.id,
            sender: "ai",
            text: reply,
        },
    });
    return { reply, sessionId: conversation.id };
}
async function getHistory(sessionId) {
    const messages = await db_1.default.message.findMany({
        where: { conversationId: sessionId },
        orderBy: { createdAt: "asc" }
    });
    return messages;
}
//# sourceMappingURL=chat.service.js.map