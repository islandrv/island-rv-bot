import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Predefined quick replies
  const quickReplies = [
    { label: "Book an RV", text: "I want to book an RV" },
    { label: "Fridge Help", text: "help with fridge" },
    { label: "AC Help", text: "help with AC" },
    { label: "Stove Help", text: "help with stove" },
    { label: "Policies", text: "tell me about rental policies" },
  ];

  const sendMessage = async (text = null) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const newMessages = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply || "Error: No reply received" },
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error contacting server" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Island RV Help Desk</h1>

      {/* Quick Reply Buttons */}
      <div style={styles.quickReplyContainer}>
        {quickReplies.map((reply, idx) => (
          <button
            key={idx}
            style={styles.quickReplyButton}
            onClick={() => sendMessage(reply.text)}
          >
            {reply.label}
          </button>
        ))}
      </div>

      {/* Chat Box */}
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#007aff" : "#e5e5ea",
              color: msg.role === "user" ? "white" : "black",
            }}
          >
            <ReactMarkdown className="markdown">{msg.content}</ReactMarkdown>
          </div>
        ))}
        {loading && <div style={styles.loading}>Assistant is typing…</div>}
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <textarea
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your question…"
        />
        <button style={styles.button} onClick={() => sendMessage()}>
          Send
        </button>
      </div>

      {/* Scoped markdown styles */}
      <style jsx>{`
        .markdown {
          line-height: 1.4;
        }
        .markdown ol {
          margin: 0 0 0 20px;
          padding: 0;
        }
        .markdown li {
          margin-bottom: 4px;
        }
        .markdown p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: "20px",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  quickReplyContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  quickReplyButton: {
    backgroundColor: "#007aff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "14px",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  message: {
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "80%",
    wordWrap: "break-word",
  },
  loading: {
    fontStyle: "italic",
    color: "#666",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    resize: "none",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#007aff",
    color: "white",
    cursor: "pointer",
  },
};
