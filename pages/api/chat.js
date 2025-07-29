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
- Troubleshoot appliances: **fridge (Norcold, Dometic)**, **stove**, and **air conditioner (A/C)**.
- When an appliance is mentioned:
  1. Confirm **brand** (for fridges: Norcold or Dometic).
  2. Provide **common troubleshooting flows** based on category:
     - **Power issue**: Check battery charge, fuses, and shore power.
     - **Propane issue**: Confirm propane valve open, check for leaks or flame.
     - **Soft reset**: Step-by-step reset instructions per appliance.
- Prioritize **safety**: If propane smell, smoke, or fire, instruct customer to exit and call emergency services.
- Provide links when relevant:
  - [View Tutorials](https://islandrv.ca/document-library/)
  - [Book Now](https://islandrv.ca/booknow/)
- Never mention or recommend competitors.
- Format all links using **Markdown** (e.g., [text](url)) — no raw HTML.

Goal:
Quickly guide customers to resolve appliance issues safely or direct them to tutorials/booking when needed.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // Debug log for troubleshooting
    console.log("OpenAI API response:", JSON.stringify(data, null, 2));

    // Handle missing response
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API"
      });
    }

    let reply = data.choices[0].message.content;

    // Ensure booking link is added for booking questions
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Convert any accidental raw <a> tags to Markdown format
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Remove competitor mentions
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
