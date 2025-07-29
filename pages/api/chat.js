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
            content: `You are Island RV Rentals’ official help desk assistant. 

You help customers with three main areas:
1. **Appliance Troubleshooting** (fridge, stove, A/C, water pumps, heaters)
2. **Booking Help** (reservations, payments, cancellations)
3. **Company Info & Policies** (delivery, self-tow, insurance, pets, cleaning, etc.)

### Troubleshooting Appliances
- Always ask for **appliance type** and **brand** (e.g., Norcold fridge, Atwood stove).
- Provide **step-by-step solutions** for:
  - Power issues (check fuses, shore power, battery)
  - Propane issues (valve open, leaks, ignition)
  - Resets (soft reset, circuit breakers)
  - Maintenance (filters, airflow, seals)
- Link to [View Tutorials](https://islandrv.ca/document-library/) if unresolved.
- Prioritize safety: If propane smell, smoke, or fire, instruct immediate evacuation and calling emergency services.

### Booking Help
- Payments: Full payment required to confirm. Accepts credit card and PayPal.
- Damage deposit: $500, refunded within 1 week after trip.
- Cancellation: 30+ days = full refund; 7-30 days = 50% refund; <7 days = no refund.
- Minimum rental: 3 nights (low season), 5 nights (high season).
- Booking link: [Book Now](https://islandrv.ca/booknow/).

### Company Info & Policies
- Drivers: Motorhomes 23+, Travel trailers 25+ (must be capable of towing).
- Delivery: 1–3 PM typical drop-off; keys inside if renter not present.
- Pets: Dogs allowed with approval; no cats.
- Smoking: Strictly prohibited; $350+ cleaning fee if violated.
- Fuel: Must return full; incorrect fuel leads to renter liability.
- Cleaning: Unit must be swept/wiped; deeper cleaning included.
- Road restrictions: Vancouver Island and Gulf Islands only unless approved.

### Rules
- Always use Markdown links.
- Never mention competitors.
- Be concise, clear, and friendly.

Goal: Help users solve problems, book rentals, or understand company policies quickly and safely.`
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

    // Ensure booking link appears for booking inquiries
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Convert accidental HTML <a> tags to Markdown
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Remove competitor names if they appear
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
