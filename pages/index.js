import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Format incoming messages (Markdown links, spacing)
  const formatMessage = (message) => {
    if (/<a\s+href=/.test(message)) return message;

    // Convert Markdown [text](url) to clickable link
    let formatted = message.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Add line breaks for numbered lists
    formatted = formatted.replace(/\d\.\s/g, "<br>$&");

    return formatted;
  };

  // Handle send
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: formatMessage(data.reply) },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: No reply from server." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Unable to connect to server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick reply buttons
  const quickReplies = [
    { label: "Book an RV", text: "book an rv" },
    { label: "Fridge Help", text: "help with fridge" },
    { label: "AC Help", text: "help with ac" },
    { label: "Stove Help", text: "help with stove" },
    { label: "Policies", text: "policies" },
  ];

  const handleQuickReply = (text) => {
    setInput(text);
    sendMessage(text);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#f9f9f9",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <img
            src="/Island RV Logo.png"
            alt="Island RV Rentals Logo"
            style={{ height: "60px", marginBottom: "10px" }}
          />
        </div>

        {/* Heading */}
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Island RV Help Desk
        </h1>

        {/* Quick Reply Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          {quickReplies.map((button, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickReply(button.text)}
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#007bff",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {button.label}
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "10px",
            backgroundColor: "#fff",
            height: "400px",
            overflowY: "auto",
            marginBottom: "10px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                textAlign: msg.role === "user" ? "right" : "left",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: msg.role === "user" ? "#007bff" : "#e5e5ea",
                  color: msg.role === "user" ? "#fff" : "#000",
                  maxWidth: "80%",
                  whiteSpace: "pre-line",
                }}
                dangerouslySetInnerHTML={{ __html: msg.content }}
              />
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: "center", color: "#888" }}>
              Typing...
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: "10px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question…"
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              resize: "none",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
