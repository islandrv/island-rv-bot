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
            content:
              "You are Island RV Rentals’ troubleshooting assistant. Help customers quickly solve RV rental issues (trailers, motorhomes, campervans). Confirm which unit they are in, gather details, provide step-by-step troubleshooting, and prioritize safety."
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
