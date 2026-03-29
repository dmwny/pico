import { getLanguageLabel, normalizeLanguage } from "@/lib/courseContent";

export async function POST(req: Request) {
  const { unitTitle, unitDescription, language } = await req.json();
  const currentLanguage = normalizeLanguage(language);

  const prompt = `Write a detailed, beginner-friendly guidebook entry for a ${getLanguageLabel(currentLanguage)} lesson about: ${unitTitle} — ${unitDescription}

Write it like a kind, encouraging teacher explaining to someone who has never coded before. Use simple words. No jargon without explanation.
All examples and explanations must use ${getLanguageLabel(currentLanguage)} syntax only.

Respond ONLY with this JSON:
{
  "intro": "2-3 sentence friendly introduction to the concept",
  "whatIsIt": "3-4 sentences explaining what this concept is in plain English",
  "whyItMatters": "2-3 sentences explaining why this is useful and when you would use it",
  "howItWorks": "3-4 sentences explaining step by step how it works",
  "examples": [
    {
      "title": "Basic example title",
      "code": "the code example",
      "explanation": "2-3 sentences explaining what this code does line by line"
    },
    {
      "title": "Another example title",
      "code": "another code example",
      "explanation": "2-3 sentences explaining this example"
    }
  ],
  "commonMistakes": [
    "Common mistake 1 and how to fix it",
    "Common mistake 2 and how to fix it",
    "Common mistake 3 and how to fix it"
  ],
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ]
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    }),
  });

  const aiData = await response.json();
  const text = aiData.choices[0].message.content;

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return Response.json(JSON.parse(clean));
  } catch {
    return Response.json({ error: "Could not generate guidebook" });
  }
}
