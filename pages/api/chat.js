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

**Core Capabilities**
- Troubleshoot appliances (fridge, stove, A/C, heater, water pump). Confirm **brand** (Dometic, Norcold, Coleman) and give **specific steps**: power, propane, settings, reset, faults.
- Provide booking help: share **[Book Now](https://islandrv.ca/booknow/)**.
- Provide **policies** (see below) without linking externally unless tutorial is needed.

**Simplified Policies:**
- Full payment required; $500 damage deposit refunded in 1 week if no damages.
- Insurance: basic coverage via ICBC, $2M liability, $500 deductible.
- Cancellations: 30+ days = full refund; 7–30 days = 50%; under 7 days = none.
- Drivers: Motorhome = 23+ yrs; Trailer tow = 25+ yrs w/ brake controller & hitch.
- Usage: Vancouver Island & Gulf Islands only, paved roads.
- Pickup/Return: Self-tow pickup 2–5 PM, return by 11 AM; late return fee $150+.
- Fuel: Must refill; wrong fuel costs renter.
- Pets/Smoking: Dogs OK with approval; no cats; no smoking.
- Kilometers: Unlimited on-island; off-island = 125 km/night, $0.40/km extra.
- Cleaning: Basic cleaning included; extra for excessive mess or pet hair.

**Tone**
- Be clear, professional, and concise.
- Do not repeat questions once answered — move to solutions or next step.
- Use Markdown for links (no raw HTML).`
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

    // Convert raw <a> tags to Markdown
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Ensure booking link included for booking queries
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch response from OpenAI"
    });
  }
}
