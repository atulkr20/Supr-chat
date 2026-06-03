import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type Message = {
  sender: "user" | "ai";
  text: string;
};

// Custom SVG Icons
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const HangerIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3h2a1 1 0 0 1 2 0 3 3 0 0 0 3-3z" />
    <path d="M2 17.5C2 15.5 3.5 14 5.5 14h13c2 0 3.5 1.5 3.5 3.5a2.5 2.5 0 0 1-4 2l-6-4.5-6 4.5a2.5 2.5 0 0 1-4-2z" />
  </svg>
);

// Client-Side Markdown Parser for formatting policies and lists
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  let inList = false;
  const listItems: React.ReactNode[] = [];
  const elements: React.ReactNode[] = [];

  const parseInline = (str: string): React.ReactNode[] => {
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const parts = str.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: "700", color: "#0f172a" }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("[") && part.includes("](")) {
        const label = part.slice(1, part.indexOf("]("));
        const url = part.slice(part.indexOf("](") + 2, -1);
        const href = url.startsWith("mailto:") ? url : (url.startsWith("http") ? url : `https://${url}`);
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: "600",
              wordBreak: "break-all"
            }}
          >
            {label}
          </a>
        );
      }
      return part;
    });
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} style={{ margin: "6px 0 10px 18px", padding: 0, listStyleType: "disc" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ margin: "4px 0", color: "#374151", fontSize: "14px" }}>{item}</li>
          ))}
        </ul>
      );
      listItems.length = 0;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(parseInline(line.substring(line.indexOf("- ") + 2)));
    } else {
      if (inList) {
        flushList(index);
        inList = false;
      }
      if (trimmed === "") {
        elements.push(<div key={`br-${index}`} style={{ height: "6px" }} />);
      } else {
        elements.push(
          <p key={`p-${index}`} style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px", lineHeight: "1.55" }}>
            {parseInline(line)}
          </p>
        );
      }
    }
  });

  if (inList) {
    flushList(lines.length);
  }

  return elements;
}

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
      axios.get(`${API_BASE_URL}/chat/${sessionId}`)
        .then((res) => {
          setMessages(res.data.messages);
        })
        .catch(() => {
          localStorage.removeItem("sessionId");
          setSessionId(null);
        });
    }
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(textToSend?: string) {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    if (!textToSend) setInput("");

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/chat/message`, {
        message: userMessage,
        sessionId,
      });

      if (!sessionId && res.data.sessionId) {
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
        { sender: "ai", text: "Something went wrong. Please check if the backend is running and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") sendMessage();
  }

  function resetChat() {
    if (window.confirm("Are you sure you want to clear this conversation session?")) {
      localStorage.removeItem("sessionId");
      setSessionId(null);
      setMessages([]);
    }
  }

  return (
    <div className="app-container">
      <div className="chat-container">
        {/* Header Block */}
        <header className="chat-header">
          <div className="header-info">
            <div className="brand-logo"><HangerIcon size={20} /></div>
            <div>
              <h2 className="brand-name">StyleStore Support</h2>
              <div className="brand-status">
                <span className="status-dot" />
                <span>Agent Online</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button className="clear-button" onClick={resetChat} title="Clear conversation">
              <TrashIcon />
            </button>
          )}
        </header>

        {/* Message Area */}
        <div className="message-area">
          {messages.length === 0 ? (
            <div className="welcome-panel">
              <h3 className="welcome-title">How can I help you today?</h3>
              <p className="welcome-desc">
                Ask me about StyleStore shipping schedules, return criteria, refunds, or support hours.
              </p>
              <div className="quick-topics">
                <button className="topic-btn" onClick={() => sendMessage("What is your shipping policy?")}>
                  ✈️ What is your shipping policy?
                </button>
                <button className="topic-btn" onClick={() => sendMessage("How can I return an item?")}>
                  📦 How can I return an item?
                </button>
                <button className="topic-btn" onClick={() => sendMessage("What is your privacy policy?")}>
                  🔒 What is your privacy policy?
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className="message-wrapper"
                style={{ justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}
              >
                {msg.sender === "ai" && (
                  <div className="message-avatar"><HangerIcon size={14} /></div>
                )}
                <div className="bubble-container" style={{ alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  <span className="sender-label">{msg.sender === "user" ? "You" : "Support"}</span>
                  <div className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "ai-bubble"}`}>
                    {msg.sender === "ai" ? parseMarkdown(msg.text) : msg.text}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message-wrapper" style={{ justifyContent: "flex-start" }}>
              <div className="message-avatar"><HangerIcon size={14} /></div>
              <div className="bubble-container" style={{ alignItems: "flex-start" }}>
                <span className="sender-label">Support</span>
                <div className="message-bubble ai-bubble">
                  <div className="typing-dots">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}