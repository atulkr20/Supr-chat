import { useState, useEffect, useRef } from "react";
import axios from "axios";

type Message = {
  sender: "user" | "ai";
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      axios.get(`http://localhost:3000/chat/${sessionId}`).then((res) => {
        setMessages(res.data.messages);
      });
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/chat/message", {
        message: userMessage,
        sessionId,
      });

      if (!sessionId) {
        setSessionId(res.data.sessionId);
        localStorage.setItem("sessionId", res.data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: res.data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.dot} />
        StyleStore Support
      </div>

      <div style={styles.messageList}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>
            Hi! Ask me anything about shipping, returns, or orders.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              background: msg.sender === "user" ? "#2563eb" : "#ffffff",
              color: msg.sender === "user" ? "#ffffff" : "#111111",
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.bubble, alignSelf: "flex-start", background: "#ffffff", color: "#888" }}>
            Agent is typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          style={{
            ...styles.button,
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "420px",
    height: "600px",
    background: "#f9f9f9",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    background: "#2563eb",
    color: "#fff",
    padding: "16px 20px",
    fontWeight: "600",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4ade80",
    display: "inline-block",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  placeholder: {
    color: "#aaa",
    textAlign: "center",
    marginTop: "40px",
    fontSize: "14px",
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  inputRow: {
    display: "flex",
    padding: "12px",
    gap: "8px",
    borderTop: "1px solid #eee",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    padding: "10px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};