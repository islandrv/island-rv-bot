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

Responsibilities:
- Provide troubleshooting for Island RV rental units (trailers, motorhomes, campervans).
- Always confirm which unit type the customer has before giving instructions.
- Guide customers step-by-step, avoiding jargon where possible.
- If there are signs of propane leaks, electrical fire, or immediate hazards, instruct the customer to exit the RV and call emergency services.
- For booking or reservation questions, always use this Markdown link: [Book Now](https://islandrv.ca/booknow/).
- For troubleshooting guides or manuals, use this Markdown link: [View Tutorials](https://islandrv.ca/document-library/).
- Never mention or recommend competitors.
- Always format links using Markdown (e.g., [text](url)) — never raw HTML.

Goal:
Help the customer resolve their issue or book an RV as quickly and safely as possible, focusing only on Island RV Rentals services.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // Debug log
    console.log("OpenAI API response:", JSON.stringify(data, null, 2));

    // Handle missing response
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API"
      });
    }

    let reply = data.choices[0].message.content;

    // Convert raw <a href="...">text</a> to Markdown [text](url)
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Ensure booking link is present if user asked about booking
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Remove competitor names if mistakenly included
    const competitors = ["Outdoorsy", "RVshare", "Cruise America", "Campanda"];
    competitors.forEach(name => {
      const regex = new RegExp(name, "gi");
      reply = reply.replace(regex, "Island RV Rentals");
    });

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch response from OpenAI"
    });
  }
}
