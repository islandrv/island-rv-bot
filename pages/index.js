import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async (text) => {
    const userMessage = { sender: "user", text };
    setMessages(prev => [...prev, userMessage]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();
    const botMessage = { sender: "bot", text: data.text };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <img src="/Island RV Logo.png" alt="Island RV Rentals Logo" className="h-12 mb-4" />
      <h1 className="text-2xl font-bold mb-4">Island RV Help Desk</h1>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => sendMessage("Book an RV")}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          Book an RV
        </button>
        <button
          onClick={() => sendMessage("Fridge Help")}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          Fridge Help
        </button>
        <button
          onClick={() => sendMessage("AC Help")}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          AC Help
        </button>
        <button
          onClick={() => sendMessage("Stove Help")}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          Stove Help
        </button>
        <button
          onClick={() => sendMessage("See included items")}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          See included items in each type of RV
        </button>
      </div>

      <div className="w-full max-w-lg bg-white border rounded p-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-2 py-1 rounded ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-lg">
        <input
          className="flex-1 border rounded-l p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
        />
        <button className="bg-blue-500 text-white px-4 rounded-r">Send</button>
      </form>
    </div>
  );
}
