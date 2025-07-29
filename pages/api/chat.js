export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Island RV's rental support assistant.

**Goals:**
- Provide troubleshooting AND general educational info for fridges, stoves, and AC.
- Use Markdown numbered lists for steps (1., 2., 3.) with line breaks.
- Offer **general info** when user asks “how does it work” or “general info”.
- Offer **troubleshooting** when user asks for “help” or “problem” with appliance.
- Escalate to [Contact Support](https://form.jotform.com/251108655575057) if:
  - Troubleshooting fails OR
  - Propane/electrical hazard OR
  - Urgent unresolved issue.

**Booking Info:**
- Always include booking link if booking is requested: [Book Now](https://islandrv.ca/booknow/)

---

### Appliance General Info

**Fridge (Dometic/Norcold)**
- Absorption fridges take 6-8 hours to cool.
- Performance is slower in hot weather and when loaded with warm food/drinks.
- Keep fridge level and vents clear for airflow.
- Minimize door opening to keep temperatures steady.

**Stove**
- Runs on propane; ensure valve is open and propane tank is full.
- Ignition: turn knob, press igniter (click sound).
- Ventilate by opening a window or roof vent while cooking.
- Clean burners regularly for even flame.

**Air Conditioner (AC)**
- Requires 30-amp shore power or generator.
- Cooling is slower in extreme heat; assist by pre-cooling RV and closing blinds.
- Check air filter for cleanliness; dirty filters reduce efficiency.
- Circuit breakers may need resetting if AC stops.

---

Focus on being concise, professional, renter-friendly, and safe.
If user asks about policies, summarize payment, deposits, cancellations, towing, smoking, and pet rules briefly.`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "No reply received" });
    }

    let reply = data.choices[0].message.content;

    // Convert raw <a> to Markdown
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Append escalation link if AI suggests support
    if (/contact support/i.test(reply)) {
      reply += `\n\n[Contact Support](https://form.jotform.com/251108655575057)`;
    }

    // Ensure booking link is always added if booking is mentioned
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch response" });
  }
}
