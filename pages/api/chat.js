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
            content: `You are Island RV's assistant. 
- Provide troubleshooting and booking help.
- If troubleshooting fails, provide escalation button to support form:
[Contact Support](https://form.jotform.com/251108655575057)
- Use numbered steps with line breaks.
- For booking, always include [Book Now](https://islandrv.ca/booknow/).`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "No reply received" });
    }

    let reply = data.choices[0].message.content;

    // Ensure Markdown links, no raw HTML
    reply = reply.replace(
      /<a\s+href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi,
      "[$2]($1)"
    );

    // Append escalation if message suggests contacting support
    if (/contact support/i.test(reply)) {
      reply += `\n\n[Contact Support](https://form.jotform.com/251108655575057)`;
    }

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch response" });
  }
}
