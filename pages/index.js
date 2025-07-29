import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Convert Markdown links and plain URLs to clickable links
  const formatMessage = (message) => {
    if (message.includes("<a")) {
      return message;
    }

    let formatted = message.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return formatted;
  };

  const sendMessage = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim()) return;

    const newMessages = [...messages, { role: "user", content: messageToSend }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
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

  // Quick reply buttons
  const quickReplies = [
    { label: "Book an RV", value: "I want to book an RV" },
    { label: "Fridge Help", value: "I need help with my fridge" },
    { label: "AC Help", value: "I need help with my A/C" },
    { label: "Stove Help", value: "I need help with my stove" },
    { label: "Policies", value: "Tell me about rental policies" },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Island RV Help Desk</h1>

      {/* Quick reply buttons */}
      <div style={styles.quickReplyContainer}>
        {quickReplies.map((qr, idx) => (
          <button
            key={idx}
            style={styles.quickReplyButton}
            onClick={() => sendMessage(qr.value)}
          >
            {qr.label}
          </button>
        ))}
      </div>

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
            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
          />
        ))}
        {loading && <div style={styles.loading}>Assistant is typing…</div>}
      </div>

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

      <style jsx>{`
        a {
          color: inherit;
          text-decoration: underline;
          cursor: pointer;
          word-break: break-word;
        }
        a:hover {
          opacity: 0.8;
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
    marginBottom: "10px",
  },
  quickReplyContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  quickReplyButton: {
    padding: "8px 14px",
    backgroundColor: "#007aff",
    color: "white",
    border: "none",
    borderRadius: "6px",
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
