import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // System instructions (retains previous context + adds bedding clarification)
    const systemPrompt = `
You are Island RV Rentals’ troubleshooting assistant. Provide calm, concise, step-by-step guidance for RV rentals (travel trailers, motorhomes, campervans). 

**Policies & Clarifications:**
- Bedding is NOT included. Fresh mattress protectors are provided, and bedding is available as an optional add-on.
- Always prioritize safety: If propane leaks, electrical fires, or hazards are suspected, instruct users to leave the RV and call emergency services.
- If troubleshooting cannot resolve the issue, direct users to call Island RV support at [your phone number].
- Avoid jargon, explain terms clearly, and adapt instructions to the specific RV model (ask for details if needed).
- Keep responses professional and avoid exclamation marks.

Answer user questions accordingly.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn’t generate a response.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Unable to connect to server." });
  }
}
