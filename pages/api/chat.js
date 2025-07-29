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
            content: `You are Island RV Rentals' assistant.

Tasks:
- Help troubleshoot appliances (fridge, stove, A/C) by asking for **brand (Dometic/Norcold/etc.)** and **issue type** (power, propane, reset).
- Provide clear numbered steps with line breaks (1., 2., 3.) and safe instructions.
- If propane or fire hazard is suspected, instruct to exit and call emergency services.
- Include common fixes for power, propane, soft reset for each appliance.
- Handle booking questions with Markdown link: [Book Now](https://islandrv.ca/booknow/).
- Provide summarized policy info when asked (age limits, cancellation, deposits, towing requirements, etc.).
- Do not output raw HTML <a>; use Markdown links only.
- Use friendly, concise, professional tone.

Goal:
Help customers quickly resolve issues or find booking/policy info safely.`
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API",
      });
    }

    let reply = data.choices[0].message.content;

    // Ensure booking link is added if booking mentioned
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply += `\n\nYou can book here: [Book Now](https://islandrv.ca/booknow/)`;
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch response from OpenAI" });
  }
}
