import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    // Load RV data
    const dataPath = path.join(process.cwd(), "data", "items.json");
    const fileData = fs.readFileSync(dataPath, "utf8");
    const itemsData = JSON.parse(fileData);

    // Check if user wants included items
    if (/included items/i.test(message) || /see the included/i.test(message)) {
      let responseText = "**Included Items and Add-Ons by RV Type:**\n\n";

      for (const [type, details] of Object.entries(itemsData)) {
        responseText += `### ${type.toUpperCase()}\n`;
        responseText += `**Included Items:**\n${details.includedItems.map(item => `- ${item}`).join("\n")}\n\n`;
        if (details.addOns && details.addOns.length > 0) {
          responseText += `**Add-Ons:**\n${details.addOns.map(add => `- ${add}`).join("\n")}\n\n`;
        }
      }

      return res.status(200).json({ text: responseText });
    }

    // Default fallback if question doesn't match
    return res.status(200).json({ text: "I’m not sure — try asking about included items or other RV features." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request" });
  }
}
