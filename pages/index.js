import { useState } from "react";
import itemsData from "../data/items.json";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async (text) => {
    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    // Handle dynamic responses for included items/add-ons directly
    if (text.toLowerCase().includes("included items")) {
      const reply = formatIncludedItems();
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      return;
    }

    if (text.toLowerCase().includes("add-ons") || text.toLowerCase().includes("rentable")) {
      const reply = formatAddOns();
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      return;
    }

    // Otherwise, fall back to API
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();
    const botMessage = { sender: "bot", text: data.text };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const formatIncludedItems = () => {
    let text = "**Included Items by RV Type:**\n\n";
    Object.entries(itemsData.rvTypes).forEach(([type, data]) => {
      text += `**${type.toUpperCase()}**:\n${data.includedItems
        .map((item) => `- ${item}`)
        .join("\n")}\n\n`;
    });
    return text;
  };

  const formatAddOns = () => {
    let text = "**Rentable Items and Delivery Options:**\n\n";
    itemsData.rentableItems.forEach((add) => {
      text += `- ${add.item} (${add.price}${add.note ? ` – ${add.note}` : ""})\n`;
    });
    text += "\n**Delivery Options:**\n";
    itemsData.deliveryOptions.forEach((del) => {
      text += `- ${del.location}: ${del.price}\n`;
    });
    return text;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      {/* Logo */}
      <img
        src="/Island RV Logo.png"
        alt="Island RV Rentals Logo"
        className="max-w-[200px] h-auto mb-4"
      />

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4 text-center">Island RV Help Desk</h1>

      {/* Quick Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button
          onClick={() => sendMessage("Book an RV")}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Book an RV
        </button>
        <button
          onClick={() => sendMessage("Fridge Help")}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fridge Help
        </button>
        <button
          onClick={() => sendMessage("AC Help")}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          AC Help
        </button>
        <button
          onClick={() => sendMessage("Stove Help")}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Stove Help
        </button>
        <button
          onClick={() => sendMessage("See included items")}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          See included items in each type of RV
        </button>
        <button
          onClick={() => sendMessage("Show add-ons")}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show Add-Ons & Delivery Options
        </button>
      </div>

      {/* Chat Box */}
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex w-full max-w-lg">
        <input
          className="flex-1 border rounded-l p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
        />
        <button className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600">Send</button>
      </form>
    </div>
  );
}
