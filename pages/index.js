import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Convert Markdown and URLs into clickable links
  const formatMessage = (message) => {
    if (message.includes("<a")) return message; // Prevent re-processing
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

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
      sendMessage(input);
    }
  };

  // Quick reply shortcuts
  const quickReplies = [
    { label: "Book an RV", text: "I want to book an RV" },
    { label: "Fridge Help", text: "I need help with my fridge" },
    { label: "AC Help", text: "I need help with my AC" },
    { label: "Stove Help", text: "I need help with my stove" },
    { label: "Policies", text: "What are your policies?" },
  ];

  // Educational info for appliances
  const generalInfo = {
    fridge:
      "**Fridge Tips**:\n- Fridges take 6–8 hours to cool after startup.\n- Performance is slower in hot weather and with warm contents.\n- Keep fridge level and vents clear.\n- Minimize door openings for steady cooling.",
    ac:
      "**AC Tips**:\n- Requires 30-amp power; weak power reduces cooling.\n- Close blinds and pre-cool RV during extreme heat.\n- Clean filters for better airflow.\n- Reset breakers if AC stops unexpectedly.",
    stove:
      "**Stove Tips**:\n- Runs on propane; check tank and valve are open.\n- Turn knob and press igniter (listen for click).\n- Ventilate while cooking.\n- Clean burners for even flame.",
  };

  // Show contextual buttons (General Info + Troubleshoot)
  const renderContextButtons = (appliance) => (
    <div style={styles.contextButtonRow}>
      <button
        style={styles.contextButton}
        onClick={() =>
          setMessages([
            ...messages,
            { role: "assistant", content: generalInfo[appliance] },
          ])
        }
      >
        General Info
      </button>
      <button
        style={styles.contextButton}
        onClick={() => sendMessage(`Troubleshoot my ${appliance}`)}
      >
        Troubleshoot
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Island RV Help Desk</h1>

      {/* Quick Reply Buttons */}
      <div style={styles.quickReplies}>
        {quickReplies.map((btn, index) => (
          <button
            key={index}
            style={styles.quickReplyButton}
            onClick={() => sendMessage(btn.text)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
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

        {/* Contextual buttons after appliance help */}
        {messages.length > 0 &&
          ["fridge", "AC", "stove"].some((a) =>
            messages[messages.length - 1].content
              .toLowerCase()
              .includes(a.toLowerCase())
          ) &&
          renderContextButtons(
            ["fridge", "AC", "stove"].find((a) =>
              messages[messages.length - 1].content
                .toLowerCase()
                .includes(a.toLowerCase())
            )
          )}

        {loading && <div style={styles.loading}>Assistant is typing…</div>}
      </div>

      {/* Input box */}
      <div style={styles.inputContainer}>
        <textarea
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your question…"
        />
        <button style={styles.button} onClick={() => sendMessage(input)}>
          Send
        </button>
      </div>

      {/* Link styles */}
      <style jsx>{`
        a {
          color: inherit;
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

// Styling
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
  quickReplies: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  quickReplyButton: {
    padding: "8px 12px",
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
    gap: "8px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginBottom: "10px",
    backgroundColor: "#f9f9f9",
  },
  message: {
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "85%",
    whiteSpace: "pre-line",
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
  contextButtonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "5px",
    marginBottom: "5px",
  },
  contextButton: {
    padding: "6px 10px",
    backgroundColor: "#e5e5ea",
    borderRadius: "6px",
    cursor: "pointer",
    border: "1px solid #ccc",
    fontSize: "12px",
  },
};
