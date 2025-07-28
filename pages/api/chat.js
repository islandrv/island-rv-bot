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

Responsibilities:
- Provide troubleshooting for Island RV rental units (trailers, motorhomes, campervans).
- Always confirm which unit type the customer has before giving instructions.
- Guide customers step-by-step, avoiding jargon where possible.
- If there are signs of propane leaks, electrical fire, or immediate hazards, instruct the customer to exit the RV and call emergency services.
- For booking or reservation questions, always use this Markdown link: [Book Now](https://islandrv.ca/booknow/).
- For troubleshooting guides or manuals, use this Markdown link: [View Tutorials](https://islandrv.ca/document-library/).
- Never mention or recommend competitors.
- Always use Markdown formatting for links (e.g., [text](url)) — never output raw HTML.

Goal:
Help the customer resolve their issue or book an RV as quickly and safely as possible, focusing only on Island RV Rentals services.`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // Log full response for debugging
    console.log("OpenAI API response:", JSON.stringify(data, null, 2));

    // Handle missing response
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({
        error: data.error?.message || "No reply received from OpenAI API"
      });
    }

    let reply = data.choices[0].message.content;

    // Safeguard: Ensure booking link is added if user mentions booking
    if (/book|reserve|rental/i.test(message) && !reply.includes("https://islandrv.ca/booknow/")) {
      reply
