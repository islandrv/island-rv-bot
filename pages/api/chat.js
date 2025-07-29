export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are the official help desk assistant for Island RV Rentals.

Focus Areas:
- Troubleshoot **appliances** (fridge, stove, A/C) rather than RV type.
- For fridges, always ask for **brand** (Norcold or Dometic) if not mentioned.
- Provide **step-by-step troubleshooting** for:
  - **Power issues** (battery, fuses, shore power)
  - **Propane issues** (valve open, leaks, flame ignition)
  - **Soft reset** (power cycle instructions)

Safety:
- If propane smell, smoke, or fire is mentioned, instruct the customer to exit immediately and call emergency services.

Links:
- Troubleshooting guides: [View Tutorials](https://islandrv.ca/document-library/)
- Bookings: [Book Now](https://islandrv.ca/booknow/)

Rules:
- Format links with Markdown only.
- Do not mention competitors.
- Be concise, calm, and professional.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API"
      });
    }

    let reply = data.choices[0].message.content;

    // Ensure booking link appears if user asks about booking
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Convert accidental raw <a> tags to Markdown
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Remove competitor mentions
    const competitors = ["Outdoorsy", "RVshare", "Cruise America", "Campanda"];
    competitors.forEach(name => {
      reply = reply.replace(new RegExp(name, "gi"), "Island RV Rentals");
    });

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch response from OpenAI"
    });
  }
}
