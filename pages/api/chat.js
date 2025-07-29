export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    // Send message to OpenAI API
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

Responsibilities:
- Provide troubleshooting for Island RV rental units (fridges, stoves, A/C).
- Always confirm appliance **brand** (Dometic or Norcold) if applicable.
- Guide step-by-step troubleshooting with clear formatting and line breaks for each step.
- Safety: If propane leaks, electrical fires, or hazards are mentioned, tell the customer to exit immediately and call emergency services.
- For bookings, always provide this Markdown link: [Book Now](https://islandrv.ca/booknow/).
- For general policies, summarize clearly but include important rules (payments, deposits, cancellations, age limits, towing requirements).
- Never mention competitors. Always keep responses concise, calm, and actionable.

Goal:
Help customers troubleshoot quickly, book rentals, or understand policies, while maintaining safety and clarity.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // Check if response contains a valid reply
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API",
      });
    }

    let reply = data.choices[0].message.content;

    // Convert raw <a href> to Markdown format
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Add automatic line breaks for numbered steps (1., 2., 3.)
    reply = reply.replace(/(\d+\.\s)(?=\*\*)/g, "\n$1");

    // Ensure booking link is present if booking is mentioned but not included
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Remove competitor names if accidentally mentioned
    const competitors = ["Outdoorsy", "RVshare", "Cruise America", "Campanda"];
    competitors.forEach(name => {
      const regex = new RegExp(name, "gi");
      reply = reply.replace(regex, "Island RV Rentals");
    });

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch response from OpenAI",
    });
  }
}
