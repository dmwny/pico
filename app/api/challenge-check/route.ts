export async function POST(req: Request) {
  const { prompt, exampleOutput, userCode } = await req.json();

  const checkPrompt = `A student was given this coding challenge:
${prompt}

The student submitted this code:
${userCode}

Evaluate if their code correctly solves the challenge. Do NOT check for specific values like names or ages — the student can use their own name, age, city, etc. Just check that the code structure and logic is correct and does what was asked.

For example if the challenge says "print your name", any print statement with any name is correct.

Respond ONLY with a JSON object:
{
  "correct": true or false,
  "explanation": "short encouraging sentence explaining what they did right or wrong, written directly to the user using 'you'",
  "hint": "if incorrect, a short hint to help them fix it, otherwise null"
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: checkPrompt }],
      max_tokens: 500,
    }),
  });

  const aiData = await response.json();
  const text = aiData.choices[0].message.content;

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return Response.json(JSON.parse(clean));
  } catch (e) {
    return Response.json({
      correct: false,
      explanation: "Could not evaluate your code. Please try again.",
      hint: null,
    });
  }
}
