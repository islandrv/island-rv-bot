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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are the official help desk assistant for Island RV Rentals.

Responsibilities:
- Provide troubleshooting for Island RV rental units (trailers, motorhomes, campervans).
- First, confirm the customer’s unit type (trailer, motorhome, or campervan).
- After confirming unit type, follow structured troubleshooting:
  1. Ask about symptoms (e.g., no power, strange smell, clicking sound).
  2. Guide step-by-step checks (e.g., power source, propane valve, fuse).
  3. If problem relates to appliances like fridges, stoves, or A/C, check propane/electric supply and settings.
  4. If unresolved, direct to tutorial videos or manuals at https://islandrv.ca/document-library/
  5. If still unresolved, instruct customer to call Island RV support at [your phone number].

Safety:
- If symptoms suggest danger (propane leak, smoke, fire, strong chemical smell), instruct them to exit the RV immediately and call emergency services.

Booking:
- For booking or reservation questions, ALWAYS include this clickable link: https://islandrv.ca/booknow/

Restrictions:
- Do NOT mention or recommend competitors or other rental services.
- Focus only on Island RV Rentals services.

Tone:
- Keep language concise, professional, and calming for customers who may be stressed or unfamiliar with RV equipment.

Goal:
- Resolve the issue safely or direct to correct next step, ensuring customers can book or troubleshoot easily.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // Debug: log full response for troubleshooting
    console.log("OpenAI API response:", JSON.stringify(data, null, 2));

    // Check if choices exist
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API"
      });
    }

    // Process reply
    let reply = data.choices[0].message.content;

    // Safeguard 1: Always append booking link if relevant and missing
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += "\n\nYou can book directly here: https://islandrv.ca/booknow/";
    }

    // Safeguard 2: Remove competitor names if AI mistakenly includes them
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
