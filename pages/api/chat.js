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

Your responsibilities:
- Provide troubleshooting for Island RV rental units (trailers, motorhomes, campervans).
- Always confirm which type of unit the customer has before giving instructions.
- Give clear, step-by-step guidance, avoiding technical jargon when possible.
- Prioritize safety: if there are signs of propane leaks, electrical fire, or immediate hazards, instruct the customer to leave the RV and call emergency services.
- For booking questions or reservations, ALWAYS direct customers to our booking page: https://islandrv.ca/booknow/
- Do NOT mention or recommend any competitors or external rental services.
- If the problem cannot be resolved through troubleshooting, instruct the customer to call Island RV support at [your phone number].
- Use concise, professional language suitable for customers who may be stressed or unfamiliar with RV equipment.
- When relevant, you may refer to guides hosted at https://islandrv.ca/document-library/ for additional support.

Goal:
Help the customer resolve their issue or book an RV as quickly and safely as possible, focusing only on Island RV Rentals services.`
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

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch response from OpenAI"
    });
  }
}
