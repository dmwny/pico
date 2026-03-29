"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLanguageLabel } from "@/lib/courseContent";
import { resolveActiveLanguage, setStoredActiveLanguage } from "@/lib/progress";

type PlacementQuestion = {
  unit: number;
  type: "multiple_choice" | "output";
  instruction: string;
  answer: string;
  codeLines?: string[];
  helperText: string;
  answerMode?: "exact" | "output" | "contains";
  acceptedAnswers?: string[];
  keywords?: string[];
};

const PYTHON_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    unit: 1,
    type: "multiple_choice",
    instruction: "What does print('Hello') do in Python?",
    answer: "Displays Hello on the screen",
    acceptedAnswers: ["displays hello on the screen", "prints hello", "shows hello"],
    helperText: "Short phrase is fine. You do not need exact punctuation.",
  },
  {
    unit: 2,
    type: "multiple_choice",
    instruction: "Which line correctly creates a variable?",
    answer: "name = 'Alice'",
    helperText: "Type one valid Python variable assignment line.",
    answerMode: "contains",
    keywords: ["=", "alice"],
  },
  {
    unit: 3,
    type: "multiple_choice",
    instruction: "What does input() always return?",
    answer: "Text (string)",
    acceptedAnswers: ["text", "string", "text string"],
    helperText: "One or two words is enough.",
  },
  {
    unit: 4,
    type: "multiple_choice",
    instruction: "What does 'Hello'.upper() return?",
    answer: "HELLO",
    acceptedAnswers: ["hello"],
    helperText: "Type the exact returned text.",
  },
  {
    unit: 5,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["x = 5", "if x > 3:", "    print('Big')", "else:", "    print('Small')"],
    answer: "Big",
    helperText: "Type only the printed output, not the code.",
    answerMode: "output",
  },
  {
    unit: 6,
    type: "output",
    instruction: "How many times does this loop run?",
    codeLines: ["for i in range(4):", "    print(i)"],
    answer: "4",
    helperText: "Type the number only.",
    answerMode: "output",
  },
  {
    unit: 7,
    type: "multiple_choice",
    instruction: "What keyword is used to define a function in Python?",
    answer: "def",
    acceptedAnswers: ["def"],
    helperText: "Type the Python keyword only.",
  },
  {
    unit: 8,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["fruits = ['apple', 'banana', 'cherry']", "print(fruits[1])"],
    answer: "banana",
    helperText: "Type only the printed item.",
    answerMode: "output",
  },
  {
    unit: 9,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["person = {'name': 'Alice', 'age': 25}", "print(person['age'])"],
    answer: "25",
    helperText: "Type only the printed value.",
    answerMode: "output",
  },
  {
    unit: 10,
    type: "multiple_choice",
    instruction: "Which mode opens a file for reading in Python?",
    answer: "'r'",
    acceptedAnswers: ["r", "'r'", "\"r\""],
    helperText: "You can include or skip the quotes.",
  },
  {
    unit: 11,
    type: "multiple_choice",
    instruction: "What does __init__ do in a Python class?",
    answer: "Sets up attributes when an object is created",
    acceptedAnswers: ["sets up attributes", "initializes the object", "sets starting values", "runs when an object is created"],
    helperText: "A short explanation is fine.",
  },
  {
    unit: 12,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["def add(a, b):", "    return a + b", "print(add(3, 7))"],
    answer: "10",
    helperText: "Type only the output.",
    answerMode: "output",
  },
];

const JAVASCRIPT_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    unit: 1,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["console.log('2' + 2);"],
    answer: "22",
    helperText: "Type only the console output.",
    answerMode: "output",
  },
  {
    unit: 2,
    type: "multiple_choice",
    instruction: "Write one JavaScript variable line that can be changed later.",
    answer: "let score = 0;",
    helperText: "Any valid `let` assignment works. It does not have to use the same variable name as the answer.",
    answerMode: "contains",
    keywords: ["let", "="],
  },
  {
    unit: 3,
    type: "output",
    instruction: "If the user types 5, what does this code print?",
    codeLines: ["const count = prompt('Count?');", "console.log(count + 2);"],
    answer: "52",
    helperText: "Type the actual output after JavaScript combines the values.",
    answerMode: "output",
  },
  {
    unit: 4,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["const word = 'hello';", "console.log(word.length + word.toUpperCase().length);"],
    answer: "10",
    helperText: "Work out both lengths, then type the final result.",
    answerMode: "output",
  },
  {
    unit: 5,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["let score = 85;", "if (score >= 90) {", "  console.log('A');", "} else if (score >= 80) {", "  console.log('B');", "} else {", "  console.log('C');", "}"],
    answer: "B",
    helperText: "Type only the console output.",
    answerMode: "output",
  },
  {
    unit: 6,
    type: "output",
    instruction: "How many values does this loop print?",
    codeLines: ["for (let i = 1; i < 8; i += 2) {", "  console.log(i);", "}"],
    answer: "4",
    helperText: "Type the count, not the full list of values.",
    answerMode: "output",
  },
  {
    unit: 7,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["function double(n) {", "  return n * 2;", "}", "console.log(double(3) + 1);"],
    answer: "7",
    helperText: "Type only the final output.",
    answerMode: "output",
  },
  {
    unit: 8,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["const fruits = ['apple', 'banana'];", "fruits.push('pear');", "console.log(fruits[2]);"],
    answer: "pear",
    helperText: "Type the item that gets printed.",
    answerMode: "output",
  },
  {
    unit: 9,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["const user = { name: 'Ava', score: 2 };", "user.score = user.score + 3;", "console.log(user.score);"],
    answer: "5",
    helperText: "Type the updated score only.",
    answerMode: "output",
  },
  {
    unit: 10,
    type: "multiple_choice",
    instruction: "Write one line that changes the text of an element with id `message` to Hello.",
    answer: "document.querySelector('#message').textContent = 'Hello';",
    helperText: "We will accept equivalent JavaScript if it selects `#message` and sets text to Hello.",
    answerMode: "contains",
    keywords: ["queryselector", "#message", "textcontent", "hello"],
  },
  {
    unit: 11,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["class Dog {", "  constructor(name) {", "    this.name = name;", "  }", "}", "const pet = new Dog('Rex');", "console.log(pet.name);"],
    answer: "Rex",
    helperText: "Type only the output.",
    answerMode: "output",
  },
  {
    unit: 12,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["const contacts = { Ava: '111' };", "function find(name) {", "  return contacts[name] || 'missing';", "}", "console.log(find('Mia'));"],
    answer: "missing",
    helperText: "Type the exact fallback value this function returns.",
    answerMode: "output",
  },
];

const UNIT_NAMES: Record<"python" | "javascript", Record<number, string>> = {
  python: {
    1: "The Basics",
    2: "Variables",
    3: "User Input",
    4: "Strings",
    5: "Conditions",
    6: "Loops",
    7: "Functions",
    8: "Lists",
    9: "Dictionaries",
    10: "File Handling",
    11: "Classes",
    12: "Final Project",
  },
  javascript: {
    1: "The Basics",
    2: "Variables",
    3: "User Input",
    4: "Strings",
    5: "Conditions",
    6: "Loops",
    7: "Functions",
    8: "Arrays",
    9: "Objects",
    10: "The DOM",
    11: "Classes",
    12: "Final Project",
  },
};

function normalizePlacementAnswer(value: string, type: PlacementQuestion["type"]): string {
  const normalized = value.trim().toLowerCase();

  if (type === "output") {
    return normalized.replace(/\s+/g, " ");
  }

  return normalized
    .replace(/['"`]/g, "")
    .replace(/;/g, "")
    .replace(/\s+/g, "");
}

function checkPlacementAnswer(question: PlacementQuestion, userAnswer: string): boolean {
  const normalizedUser = normalizePlacementAnswer(userAnswer, question.type);
  const normalizedAnswer = normalizePlacementAnswer(question.answer, question.type);

  if (normalizedUser === normalizedAnswer) return true;

  if (question.acceptedAnswers?.some((answer) => normalizePlacementAnswer(answer, question.type) === normalizedUser)) {
    return true;
  }

  if (question.answerMode === "contains" && question.keywords) {
    return question.keywords.every((keyword) => normalizedUser.includes(keyword));
  }

  return false;
}

function getPlacement(results: boolean[]): number {
  let lastCorrectUnit = 0;
  let consecutiveWrong = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      lastCorrectUnit = i + 1;
      consecutiveWrong = 0;
    } else {
      consecutiveWrong++;
      if (consecutiveWrong >= 2) break;
    }
  }

  const placement = Math.min(lastCorrectUnit + 1, 12);
  return Math.max(placement, 1);
}

export default function PlacementTest() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<"python" | "javascript" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"intro" | "test" | "results">("intro");
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [placement, setPlacement] = useState(1);
  const [saving, setSaving] = useState(false);

  const questions = useMemo(
    () => currentLanguage === "javascript" ? JAVASCRIPT_PLACEMENT_QUESTIONS : PYTHON_PLACEMENT_QUESTIONS,
    [currentLanguage]
  );
  const displayLanguage = currentLanguage ?? "python";

  const question = questions[current];
  const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100;
  const answerLabel = question.type === "output" ? "Type The Output" : "Type Your Answer";
  const answerPlaceholder = question.type === "output"
    ? "Type the result here"
    : "Type your answer here";
  const isCorrect = checkPlacementAnswer(question, userAnswer);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const loadLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentLanguage(await resolveActiveLanguage(user.id));
    };

    loadLanguage();
  }, [router]);

  const handleCheckAnswer = () => {
    if (answered || !userAnswer.trim()) return;
    setAnswered(true);
    setResults((prev) => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setPlacement(getPlacement(results));
      setPhase("results");
      return;
    }

    setCurrent((prev) => prev + 1);
    setUserAnswer("");
    setAnswered(false);
  };

  const savePlacementProgress = async (completedLessons: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const placementLanguage = currentLanguage ?? await resolveActiveLanguage(user.id);

    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        language: placementLanguage,
        values: {
          completed_lessons: JSON.stringify(completedLessons),
          xp: 0,
          streak: 0,
          achievements: JSON.stringify([]),
          today_xp: 0,
          today_lessons: 0,
          today_perfect: 0,
        },
      }),
    });

    setStoredActiveLanguage(user.id, placementLanguage);
  };

  const handleStartFromPlacement = async () => {
    setSaving(true);
    const completedLessons: string[] = [];

    for (let unit = 1; unit < placement; unit++) {
      for (let lesson = 1; lesson <= 5; lesson++) {
        completedLessons.push(`${unit}-${lesson}`);
      }
    }

    await savePlacementProgress(completedLessons);
    setSaving(false);
    router.push(`/learn#unit-${placement}`);
  };

  const handleStartFromBeginning = async () => {
    setSaving(true);
    await savePlacementProgress([]);
    setSaving(false);
    router.push("/learn");
  };

  const correctCount = results.filter(Boolean).length;

  if (phase === "intro") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[2rem] shadow-[0_18px_50px_rgba(34,197,94,0.12)] border border-green-100 p-10 text-center mb-4">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">What&apos;s your level?</h1>
            <p className="text-gray-500 font-semibold mb-4 leading-relaxed">
              {mounted
                ? `Take a quick 12-question ${getLanguageLabel(displayLanguage)} test to find out where to start.`
                : "Take a quick 12-question test to find out where to start."}
            </p>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8 text-left">
              <p className="text-green-700 font-extrabold text-sm mb-1">How it works</p>
              <p className="text-sm text-green-900 font-semibold leading-relaxed">
                You&apos;ll type answers instead of guessing from buttons. We accept equivalent answers when they mean the same thing.
              </p>
            </div>

            <button
              onClick={() => setPhase("test")}
              className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg mb-3"
            >
              Take the placement test
            </button>
            <button
              onClick={handleStartFromBeginning}
              className="w-full border-2 border-gray-200 text-gray-600 font-extrabold py-4 rounded-2xl hover:bg-gray-50 transition text-lg"
            >
              Start from the beginning
            </button>
          </div>
          <p className="text-center text-gray-400 text-sm font-semibold">Takes about 3 minutes</p>
        </div>
      </main>
    );
  }

  if (phase === "results") {
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[2rem] shadow-[0_18px_50px_rgba(34,197,94,0.12)] border border-green-100 p-10 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">
                {percentage >= 80 ? "🎓" : percentage >= 50 ? "📚" : "🌱"}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              {percentage >= 80 ? "Great knowledge!" : percentage >= 50 ? "Good foundation!" : "Perfect starting point!"}
            </h1>

            <p className="text-gray-500 font-semibold mb-6">
              You got {correctCount} out of {questions.length} correct
            </p>

            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8">
              <div className="h-4 bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
              <p className="text-green-600 text-xs font-extrabold uppercase tracking-wider mb-1">Your starting point</p>
              <p className="text-2xl font-extrabold text-gray-900">
                Unit {placement}: {UNIT_NAMES[displayLanguage][placement]}
              </p>
              {placement > 1 && (
                <p className="text-gray-500 font-semibold text-sm mt-2">
                  Units 1-{placement - 1} will be unlocked automatically
                </p>
              )}
            </div>

            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              {results.map((correct, index) => (
                <div
                  key={index}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold ${correct ? "bg-green-500" : "bg-red-400"}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            <button
              onClick={handleStartFromPlacement}
              disabled={saving}
              className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg mb-3 disabled:opacity-50"
            >
              {saving ? "Setting up..." : `Start at Unit ${placement}`}
            </button>
            <button
              onClick={handleStartFromBeginning}
              disabled={saving}
              className="w-full border-2 border-gray-200 text-gray-600 font-extrabold py-4 rounded-2xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              Start from Unit 1 instead
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 pt-8 pb-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => setPhase("intro")}
            className="text-gray-400 hover:text-gray-600 font-extrabold text-lg w-9 h-9 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-gray-200 transition"
          >
            ✕
          </button>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-3 bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-extrabold text-gray-400 min-w-12 text-right">{current + 1}/{questions.length}</p>
        </div>
        <p className="text-xs font-extrabold text-green-500 uppercase tracking-[0.18em] mt-2">
          Unit {question.unit}: {UNIT_NAMES[displayLanguage][question.unit]}
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 flex-1 pb-10">
        <div className="bg-white border border-green-100 rounded-[2rem] shadow-[0_18px_50px_rgba(34,197,94,0.1)] p-8">
          <p className="text-3xl font-black text-gray-900 leading-tight mb-6">{question.instruction}</p>

          {question.codeLines && (
            <div className="bg-gray-950 rounded-3xl p-5 mb-6 overflow-x-auto">
              {question.codeLines.map((line, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-gray-600 font-mono text-sm w-4 shrink-0">{index + 1}</span>
                  <span className="text-green-400 font-mono text-sm whitespace-pre">{line}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-5">
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-[0.14em] mb-1">{answerLabel}</p>
            <p className="text-sm text-gray-600 font-semibold leading-relaxed">{question.helperText}</p>
          </div>

          <div className="space-y-3 mb-6">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={answered}
              placeholder={answerPlaceholder}
              className="w-full min-h-32 rounded-3xl border-2 border-gray-200 bg-white px-5 py-4 font-mono text-sm text-gray-800 focus:border-green-400 focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500 shadow-sm"
            />
          </div>

          {answered && (
            <div className={`rounded-3xl p-5 mb-4 border-2 ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className={`font-extrabold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                {isCorrect ? "Correct!" : `Not quite - accepted answer: ${question.answer}`}
              </p>
              {!isCorrect && (
                <p className="text-sm font-semibold text-red-500 mt-2">
                  We also accept equivalent answers when they mean the same thing, but this one did not match the expected idea.
                </p>
              )}
            </div>
          )}

          {!answered && (
            <button
              onClick={handleCheckAnswer}
              disabled={!userAnswer.trim()}
              className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check answer
            </button>
          )}

          {answered && (
            <button
              onClick={handleNext}
              className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg"
            >
              {current + 1 >= questions.length ? "See my results" : "Next question"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
