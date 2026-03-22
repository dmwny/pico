export async function POST(req: Request) {
  const { question, correctAnswer, userAnswer } = await req.json();

  const prompt = `A student was asked: "${question}"
The correct answer is: "${correctAnswer}"
The student answered: "${userAnswer}"

Is the student's answer correct? Be lenient with spacing and capitalization.

Respond ONLY with a JSON object:
{
  "correct": true or false,
  "explanation": "one short encouraging sentence explaining why, written directly to the user using 'you'"
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
      max_tokens: 200,
    }),
  });

  const aiData = await response.json();
  const text = aiData.choices[0].message.content;

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return Response.json(JSON.parse(clean));
  } catch (e) {
    return Response.json({ correct: false, explanation: "Could not check your answer. Try again." });
  }
}