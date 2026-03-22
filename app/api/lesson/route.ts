import { QUESTION_BANK } from "./questionBank";

export async function POST(req: Request) {
  const { topic, unitId, lessonId } = await req.json();

  const unitData = QUESTION_BANK[unitId]?.[lessonId];

  if (unitData) {
    const shuffled = [...unitData.questions].sort(() => Math.random() - 0.5);
    return Response.json({
      teaching: unitData.teaching,
      questions: shuffled.slice(0, 4),
    });
  }

  // Fallback to AI if no hardcoded questions exist
  const prompt = `You are teaching a complete beginner about ${topic}.
Use simple, friendly language. No jargon. Talk like a kind friend.

Generate a teaching intro and exactly 4 questions. Mix these question types:
- "arrange": show code with blanks, student fills in the missing parts
- "fill": code has a ___ blank, student picks the correct tile
- "multiple_choice": student picks correct answer from 4 options
- "output": given code, student picks what it prints

Respond ONLY with this JSON, no extra text:
{
  "teaching": {
    "title": "short friendly title",
    "explanation": "2-3 simple sentences explaining the concept. No jargon.",
    "example": "short 1-3 line code example",
    "tip": "one short encouraging tip"
  },
  "questions": [
    {
      "type": "fill",
      "instruction": "Complete the code",
      "codeLines": ["___(42)"],
      "tiles": ["print", "input", "return", "def"],
      "answer": "print",
      "explanation": "print() displays values on the screen",
      "consoleOutput": "42"
    }
  ]
}

Rules:
- Keep everything super simple for a total beginner
- For arrange questions: you MUST include codeLines with ___ blanks
- For fill questions: use ___ to show the blank, tiles include correct answer plus 3 wrong options
- Always shuffle tiles
- Generate exactly 4 questions mixing all types`;

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
  } catch (e) {
    return Response.json({ teaching: null, questions: [] });
  }
}