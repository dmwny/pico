export async function POST(req: Request) {
  const { courseTitle, lessonTitle, stagePrompt, stageNote, codeLines, userAnswer, expectedAnswer } = await req.json();

  if (!courseTitle || !lessonTitle || !stagePrompt) {
    return Response.json({ error: "Missing mini-course context" }, { status: 400 });
  }

  const prompt = `You are helping a beginner in a coding mini-course.

Course: ${courseTitle}
Lesson: ${lessonTitle}
Task: ${stagePrompt}
Teacher note: ${stageNote || "None"}

Current code:
${Array.isArray(codeLines) ? codeLines.join("\n") : ""}

Student answer:
${typeof userAnswer === "string" ? userAnswer : Array.isArray(userAnswer) ? userAnswer.join(" ") : ""}

Expected answer:
${typeof expectedAnswer === "string" ? expectedAnswer : Array.isArray(expectedAnswer) ? expectedAnswer.join(" ") : ""}

Explain what they should do next without overwhelming them.
Respond ONLY as JSON with this shape:
{
  "hint": "one short concrete hint",
  "nextLines": ["line 1", "line 2"],
  "why": "2-3 short sentences explaining why those next lines work"
}

Rules:
- Be direct and beginner-friendly.
- Do not write more than 2 suggested lines.
- If the task only needs one line, return one line.
- Explain the next move, not a full long lesson.
- It is okay to reveal the next line(s) because the learner explicitly asked for help.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }),
  });

  const aiData = await response.json();
  const text = aiData?.choices?.[0]?.message?.content;

  try {
    const clean = String(text || "").replace(/```json|```/g, "").trim();
    return Response.json(JSON.parse(clean));
  } catch {
    return Response.json({
      hint: "Focus on the missing method or value named in the prompt.",
      nextLines: Array.isArray(codeLines) ? codeLines.filter((line: string) => line.includes("___")).slice(0, 2) : [],
      why: "The missing line should match the API call the lesson is teaching.",
    });
  }
}
