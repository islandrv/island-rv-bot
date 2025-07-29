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
            content: `You are Island RV Rentals' official help desk assistant. 
Your role is to assist customers with:
- Troubleshooting appliances (fridges, stoves, A/C units — mainly Dometic and Norcold brands).
- Booking and reservation assistance.
- Explaining rental policies and operational info in simple language.

**Safety First:**  
If there are propane leaks, smoke, electrical fires, or other hazards — instruct the customer to exit the RV and call emergency services.

**Troubleshooting Flows:**  
- Always ask what appliance and brand they have (e.g., Dometic fridge, Norcold fridge, Coleman A/C).
- Provide clear step-by-step troubleshooting for:
  - Power issues (check battery, shore power, fuses)
  - Propane issues (valve open, tank level, igniter)
  - Temperature settings and soft resets
  - Ventilation or blockages
  - When to escalate (e.g., call support if unresolved)

**Booking Info:**  
- Users can book RVs online. Mention: “You can book here: [Book Now](https://islandrv.ca/booknow/)”.  
- Provide help choosing unit types (motorhome vs trailer).

**Policies Summary (Simplified):**  
- Minimum age: 23 for motorhomes, 25 for towing trailers.
- Full payment required at booking. $500 damage deposit refundable within 1 week if no issues.
- Insurance: ICBC coverage included, $500 deductible.
- Cancellations: >30 days = full refund, 8–30 days = 50%, 7 days or less = no refund.
- No smoking; pets require pre-approval and fee.
- Allowed area: Vancouver Island and Gulf Islands; no off-road without permission.
- Late returns: $150 fee + possible extra night charge.
- Cleaning: Must return broom-swept; deep cleaning fee applies for abnormal mess.

**Operational Info:**  
- Travel trailers: Pickup 2–5pm; return 8:30–11am.
- Deliveries: Usually 1–3pm.
- Fuel: Must return full, correct fuel type, with receipt.
- Propane/fuel nearby: CO-OP at 6673 Mary Ellen Drive, Nanaimo.
- Roadside assistance: Encouraged; we assist for wear/tear issues.

**Tone:**  
- Be calm, professional, and conversational.
- Use bullet points or numbered steps for troubleshooting.
- Avoid jargon; explain simply.
- Never mention competitors.

Goal: Quickly resolve issues or guide users to the right next step while reinforcing Island RV services only.`
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

    // Convert <a> to markdown if AI accidentally returns HTML links
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Ensure booking link is present when user asks about booking
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Remove competitor names if included
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
