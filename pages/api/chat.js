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
            content: `You are Island RV Rentals' help desk assistant. Provide step-by-step troubleshooting for fridges, AC, and stoves (Dometic and Norcold). 
Format responses in clean Markdown with numbered lists (each number on a new line) and bold key terms.

**Escalation Policy:**
- If user has tried all steps or describes critical issues (propane leak, electrical hazard, persistent failure), recommend escalation.
- Always include a Contact Support button:
[Contact Support](https://form.jotform.com/251108655575057)

**Booking Info:**
- For bookings, use this link: [Book Now](https://islandrv.ca/booknow/)

**Policies:**
- Summarize policies (payment, insurance, damage deposit, cancellation, usage rules) instead of long text unless user asks for details.

**Goal:**
Help renters troubleshoot quickly, guide them to booking links or policies when requested, and escalate when needed.`
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

    // Ensure escalation button is appended if AI recommends support
    if (/contact support/i.test(reply)) {
      reply += `\n\n[Contact Support](https://form.jotform.com/251108655575057)`;
    }

    // Ensure booking link presence when booking keywords appear
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book here: [Book Now](https://islandrv.ca/booknow/)`;
    }

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
