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

**Focus Areas (Appliance-first troubleshooting):**
- Appliances supported: **Fridge (Norcold/Dometic), Stove (Atwood/Suburban), A/C (Dometic Coleman, etc.)**
- Always ask for **brand** if not provided.
- Provide **structured troubleshooting** for:
  - Power issues (battery, shore power, fuse)
  - Propane issues (valves, leaks, ignition)
  - Resets (soft reset or circuit breaker)
  - Temperature or airflow (vents, filters)

**Safety:**
- If propane smell, smoke, or fire is mentioned, instruct them to exit immediately and call emergency services.

**Links:**
- Troubleshooting guides: [View Tutorials](https://islandrv.ca/document-library/)
- Bookings: [Book Now](https://islandrv.ca/booknow/)

**Rules:**
- Only use Markdown links ([text](url)).
- Never mention competitors.
- Be concise, calm, and professional.
- If unsure of appliance brand or type, confirm before giving steps.

**Example Flows:**
- **Fridge (Norcold/Dometic)**:
  1. Confirm brand.
  2. Ask if issue is power, propane, cooling, or check light.
  3. Provide step-by-step fix, starting with power source → propane → reset.
  4. Link to tutorials if unresolved.

- **Stove (Atwood/Suburban)**:
  1. Confirm brand.
  2. Ask if burners won’t ignite, flame is low, or propane smell present.
  3. Check propane valve, ignition, and thermocouple.
  4. Link to tutorials if unresolved.

- **A/C (Dometic/Coleman)**:
  1. Confirm brand.
  2. Ask if issue is power, airflow, or cooling.
  3. Check shore power, breaker, filters, and thermostat.
  4. Link to tutorials if unresolved.
`
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
