"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.generateReply = generateReply;
let groq;
try {
    if (process.env.GROQ_API_KEY) {
        const Groq = require("groq-sdk");
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
}
catch (e) {
    groq = undefined;
}
exports.SYSTEM_PROMPT = `You are a helpful customer support agent for StyleStore, a small e-commerce store.

Here is what you know about the store:
- Shipping: We ship across India in 3-5 business days. International shipping takes 7-14 days.
- Returns: Items can be returned within 30 days of delivery. Items must be unused and in original packaging.
- Refunds: Refunds are processed within 5-7 business days after approval.
- Support hours: Monday to Saturday, 9:00 AM to 6:00 PM IST.
- Tone: Friendly, helpful, and concise.

When answering customer questions, include shipping time, return policy, and refund processing details where relevant.`;
async function generateReply(history, userMessage) {
    const messages = [
        { role: "system", content: exports.SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessage },
    ];
    if (!groq)
        return "AI not configured (missing GROQ_API_KEY).";
    const client = groq;
    const response = await client.chat?.completions?.create?.({
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 500,
    }).catch((err) => {
        console.error("Groq API Error:", err);
        return undefined;
    });
    if (!response)
        return "Sorry, I could not generate a reply.";
    return response.choices?.[0]?.message?.content ?? "Sorry, I could not generate a reply.";
}
exports.default = groq;
//# sourceMappingURL=llm.service.js.map