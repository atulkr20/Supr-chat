import prisma from "../db";
import { generateReply } from ".//llm.service";

export async function handleMessage(sessionId: string | undefined, text: string) {

    let conversation;

    if (sessionId) {
        conversation = await prisma.conversation.findUnique({
            where: { id: sessionId },
        });
    } 

    if(!conversation) {
        conversation = await prisma.conversation.create({ data: {} });
    }

    // Fetching past messages for context
    const pastMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 10,
    });

    // Format history for groq

    const history = pastMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' as const: 'assistantd' as const,
        content: m.text,
    }));


    // saviong user message
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            sender: 'user',
            text,
        },
    });

    // get ai reply
    const reply = await generateReply(history, text);

    // save ai reply 
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            sender: "ai",
            text: reply,
        },
    });

    return { reply, sessionId: conversation.id};
}


export async function getHistory(sessionId: string) {
    const messages = await prisma.message.findMany({
        where: { conversationId: sessionId },
        orderBy: { createdAt: "asc"}
    });

    return messages;
}