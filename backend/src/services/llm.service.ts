const Groq: any = require("groq-sdk");

const groq: any = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const SYSTEM_PROMPT = `You are a helpful customer support agent for StyleStore, a small e-commerce store.

Here is what you know about the store:
- Shipping: We ship across India in 3-5 business days. International shipping takes 7-14 days.
- Returns: Items can be returned within 30 days of delivery. Items must be unused and in original packaging.
- Refunds: Refunds are processed within 5-7 business days after approval.
- Support hours: Monday to Saturday, 9:00 AM to 6:00 PM IST.
- Tone: Friendly, helpful, and concise.

When answering customer questions, include shipping time, return policy, and refund processing details where relevant.`;

export type Message = { role: "system" | "user" | "assistant"; content: string };

export async function generateReply(history: Message[], userMessage: string): Promise<string> {
    const messages: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessage },
    ];

    // `groq` SDK typings may vary; call via `any` to avoid compile-time SDK type errors.
    const client: any = groq as any;

    const response = await client.chat?.completions?.create?.({
        model: "llama3-8b-8192",
        messages,
        max_tokens: 500,
    }).catch(() => undefined);

    if (!response) return "Sorry, I could not generate a reply.";

    return response.choices?.[0]?.message?.content ?? "Sorry, I could not generate a reply.";
}

export default groq;