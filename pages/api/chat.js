export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, unitType } = req.body;

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

Context:
- The user has identified their unit type as: ${unitType || "unknown"}.
- Do not ask repeatedly for the unit type if it has been provided.
- Provide troubleshooting for Island RV rental units (trailers, motorhomes, campervans).
- For booking: Always use Markdown links like [Book Now](https://islandrv.ca/booknow/).
- For tutorials: Use [View Tutorials](https://islandrv.ca/document-library/).
- Never mention competitors or external services.
- Always format links in Markdown, never raw HTML.

Goal:
Help the customer troubleshoot or book as quickly and safely as possible, focusing only on Island RV Rentals services.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "No reply received from OpenAI API" });
    }

    let reply = data.choices[0].message.content;

    // Convert HTML to Markdown if any
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Add booking link if user asked about booking
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Remove competitors if present
    const competitors = ["Outdoorsy", "RVshare", "Cruise America", "Campanda"];
    competitors.forEach((name) => {
      const regex = new RegExp(name, "gi");
      reply = reply.replace(regex, "Island RV Rentals");
    });

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch response from OpenAI" });
  }
}
