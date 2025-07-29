import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  const lowerMsg = message.toLowerCase();

  try {
    // Load data from items.json
    const dataPath = path.join(process.cwd(), "data", "items.json");
    const fileData = fs.readFileSync(dataPath, "utf8");
    const itemsData = JSON.parse(fileData);

    let reply = "";

    // 1. Included Items
    if (lowerMsg.includes("included items")) {
      reply += "**Included Items by RV Type:**\n\n";
      Object.entries(itemsData.rvTypes).forEach(([type, data]) => {
        reply += `**${type.toUpperCase()}**:\n${data.includedItems
          .map((item) => `- ${item}`)
          .join("\n")}\n\n`;
      });
      return res.status(200).json({ text: reply });
    }

    // 2. Add-Ons
    if (lowerMsg.includes("add-ons") || lowerMsg.includes("rentable")) {
      reply += "**Rentable Items and Delivery Options:**\n\n";
      itemsData.rentableItems.forEach((add) => {
        reply += `- ${add.item} (${add.price}${add.note ? ` – ${add.note}` : ""})\n`;
      });
      reply += "\n**Delivery Options:**\n";
      itemsData.deliveryOptions.forEach((del) => {
        reply += `- ${del.location}: ${del.price}\n`;
      });
      return res.status(200).json({ text: reply });
    }

    // 3. Booking Rules / Fees
    if (
      lowerMsg.includes("minimum stay") ||
      lowerMsg.includes("discount") ||
      lowerMsg.includes("fees") ||
      lowerMsg.includes("cost")
    ) {
      reply += "**Booking Rules & Fees:**\n";
      reply += `Minimum Stay: ${itemsData.bookingRules.minimumNights.lowSeason} nights (low season), ${itemsData.bookingRules.minimumNights.highSeason} nights (high season)\n\n`;

      reply += "**Seasonal Discounts:**\n";
      reply += `- ${itemsData.bookingRules.seasonalDiscounts.lowSeason.dates}: ${itemsData.bookingRules.seasonalDiscounts.lowSeason.discount}\n`;
      itemsData.bookingRules.seasonalDiscounts.multiNight.forEach((disc) => {
        reply += `- ${disc.nights} nights: ${disc.discount}\n`;
      });

      reply += "\n**Additional Fees:**\n";
      itemsData.bookingRules.additionalFees.forEach((fee) => {
        reply += `- ${fee.fee}: ${fee.amount}\n`;
      });

      return res.status(200).json({ text: reply });
    }

    // 4. Fallback → OpenAI for troubleshooting
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are the official help desk assistant for Island RV Rentals.

Responsibilities:
- Provide troubleshooting for Island RV rental units (trailers, motorhomes, campervans).
- Confirm the appliance type if relevant (fridge, stove, AC).
- Offer safe step-by-step guidance; direct urgent issues to emergency services.
- For booking questions, include: [Book Now](https://islandrv.ca/booknow/).
- Never mention competitors.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const aiData = await aiResponse.json();
    if (!aiData.choices || !aiData.choices[0]?.message?.content) {
      return res.status(500).json({
        error: aiData.error?.message || "No reply received from OpenAI API"
      });
    }

    reply = aiData.choices[0].message.content;

    return res.status(200).json({ text: reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request" });
  }
}
