import { useState, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! What do you need help with?\n\n- **Appliance Troubleshooting** (fridge, stove, A/C, water, heater)\n- **Booking Help** (reservations, payments, cancellations)\n- **Company Info & Policies** (delivery, pets, insurance, check-in/out)"
      }
    ]);
  }, []);

  const formatMessage = (message) => {
    if (message.includes("<a")) return message;

    return message.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  };

  const sendMessage = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim()) return;

    const newMessages = [...messages, { role: "user", content: messageToSend }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setShowQuickReplies(false);

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

  const handleQuickReply = (option) => {
    sendMessage(option);
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

        {/* Quick reply buttons */}
        {showQuickReplies && (
          <div style={styles.quickReplies}>
            <button style={styles.quickButton} onClick={() => handleQuickReply("Appliance Troubleshooting")}>
              Appliance
            </button>
            <button style={styles.quickButton} onClick={() => handleQuickReply("Booking Help")}>
              Booking
            </button>
            <button style={styles.quickButton} onClick={() => handleQuickReply("Company Info & Policies")}>
              Policies
            </button>
          </div>
        )}
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
          color: #007aff;
          text-decoration: underline;
          cursor: pointer;
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
    marginBottom: "20px",
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
  quickReplies: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  quickButton: {
    padding: "8px 16px",
    border: "1px solid #007aff",
    borderRadius: "8px",
    backgroundColor: "white",
    color: "#007aff",
    cursor: "pointer",
    fontSize: "14px",
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
