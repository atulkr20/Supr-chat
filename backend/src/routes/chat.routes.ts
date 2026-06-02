import { Router, Request, Response } from 'express';
import { handleMessage, getHistory } from '../services/chat.service';

const router = Router();

router.post("/message", async (req: Request, res: Response) => {
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
        const result = await handleMessage(sessionId, message.trim());
        res.json(result);
    } catch (error) {
        console.error("chat error:", error);
        res.status(500).json({ error: "something went wrong. Please try again."});
    }
});

router.get("/:sessionId", async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
    }

    try {
        const messages = await getHistory(sessionId as string);
        res.json({ messages });
    } catch (error) {
        console.error("History error:", error);
        res.status(500).json({ error: "could not fetch history." });
    }
});

export default router;