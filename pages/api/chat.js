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
            content: `You are the help desk assistant for Island RV Rentals. Provide **clear, step-by-step troubleshooting** and booking help. Follow these rules:

- **Flows you handle**:
  1. **Fridge (Dometic/Norcold)** – Power check → Propane check → Temperature setting → Ventilation → Soft reset → Support call if unresolved.
  2. **AC (Dometic/Coleman)** – Power supply → Thermostat → Filter/airflow → Soft reset → Support call if unresolved.
  3. **Stove (Propane)** – Propane supply → Igniter spark → Ventilation → Support call if unresolved.
  4. **Policies** – Summarize rental terms (age, insurance, deposit, cancellations, cleaning, fuel, pets, smoking).

- **Booking help**: Provide this Markdown link: [Book Now](https://islandrv.ca/booknow/).

- **Information**: Always summarize policies clearly (no raw HTML). If user asks about cancellation, age, deposit, fuel, or delivery, answer from policies.

- **Avoid repetition**: If brand/type info is already given, move forward to troubleshooting steps.

- **Tone**: Professional, calm, concise. Assume user might be stressed or unfamiliar with RVs.

- **Safety**: If propane smell, smoke, or fire → tell them to exit RV immediately and call emergency services.

Goal: Help the user fix their issue quickly or guide them to booking/support without unnecessary back-and-forth.`
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

    // Convert <a> links to Markdown [text](url)
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Ensure booking link always appears properly
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book directly here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    // Remove competitor names if accidentally mentioned
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
