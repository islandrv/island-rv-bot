import { OpenAI } from "openai";
import items from "../../data/items.json"; // <-- Make sure to create this file

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Build dynamic item list for the system message
    const formattedItems = Object.entries(items)
      .map(([size, data]) => {
        return `**${size.toUpperCase()} RV**  
Included: ${data.includedItems.join(", ")}  
Add-ons: ${data.addOns.join(", ")}`;
      })
      .join("\n\n");

    // System instructions with dynamic items included
    const systemPrompt = `
You are Island RV Rentals’ troubleshooting and booking assistant.

- Provide calm, step-by-step guidance for RV rentals (travel trailers, motorhomes, campervans).
- Clarify bedding policy: Bedding is NOT included. Fresh mattress protectors are provided, and bedding is an optional add-on.
- Always prioritize safety: If propane leaks, electrical fires, or hazards are suspected, instruct users to leave the RV and call emergency services.
- Avoid mentioning competitors. Keep responses professional and concise.

**Included and Optional Items by RV Type:**
${formattedItems}

If users ask about what’s included or available add-ons, reference the above information accurately.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn’t generate a response.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Unable to connect to server." });
  }
}
