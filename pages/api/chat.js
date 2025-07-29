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
- The user’s RV unit type is: ${unitType || "unknown"}.
- Do not repeatedly ask for the unit type if already provided; confirm once and proceed.
- Provide calm, step-by-step troubleshooting tailored to trailers, motorhomes, and campervans.
- Prioritize safety: if propane leaks, smoke, or fire are suspected, instruct evacuation and emergency services.
- For booking: Always provide a Markdown link [Book Now](https://islandrv.ca/booknow/).
- For manuals/tutorials: Use [View Tutorials](https://islandrv.ca/document-library/).
- Never mention competitors or external rental services.
- Always use Markdown links, never raw HTML.

### Troubleshooting Flows (Use these as structured steps):

**Fridge Issues (Dometic / Norcold):**
1. Ask: “Is the fridge running on propane, battery, or shore power?”
2. Check propane: Is the propane valve open? Are other propane appliances working (e.g., stove)?
3. Check power: Is the RV plugged into shore power or is the battery charged?
4. Inspect fridge control panel: Are there error codes or blinking lights?
5. Suggest resetting fridge (power cycle) and refer to [View Tutorials](https://islandrv.ca/document-library/) for detailed reset steps.

**Power Issues (No lights / outlets):**
1. Ask: “Is the RV connected to shore power, generator, or battery?”
2. Check breaker panel and fuses; guide user to reset any tripped breakers.
3. Verify battery charge level; recommend testing with multimeter if available.
4. Suggest connecting to shore power and checking indicator lights.

**Water Pump / Plumbing Issues:**
1. Confirm if water tank is filled.
2. Check pump switch and fuse.
3. Listen for pump activation; if silent, guide through fuse and wiring checks.

**Air Conditioning Issues:**
1. Confirm if running on shore power (most RV AC units won’t work on 12V battery alone).
2. Check thermostat settings (mode and temperature).
3. Inspect breaker/fuse for AC unit.
4. Recommend waiting a few minutes after power loss before restarting.

---

Goal: Help the customer resolve their issue or guide them to booking/manual links as quickly and safely as possible, focusing only on Island RV Rentals services.`
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

    // Convert any accidental HTML to Markdown
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Add booking link if user asked about booking
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Remove competitor mentions if present
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
