"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PLACEMENT_QUESTIONS = [
  // Unit 1 — Basics
  {
    unit: 1,
    type: "multiple_choice",
    instruction: "What does print('Hello') do in Python?",
    options: ["Displays Hello on the screen", "Creates a variable called Hello", "Saves Hello to a file", "Nothing"],
    answer: "Displays Hello on the screen",
  },
  // Unit 2 — Variables
  {
    unit: 2,
    type: "multiple_choice",
    instruction: "Which line correctly creates a variable?",
    options: ["name = 'Alice'", "= name 'Alice'", "'Alice' = name", "var name = 'Alice'"],
    answer: "name = 'Alice'",
  },
  // Unit 3 — Input
  {
    unit: 3,
    type: "multiple_choice",
    instruction: "What does input() always return?",
    options: ["Text (string)", "A number", "True or False", "Nothing"],
    answer: "Text (string)",
  },
  // Unit 4 — Strings
  {
    unit: 4,
    type: "multiple_choice",
    instruction: "What does 'Hello'.upper() return?",
    options: ["HELLO", "hello", "Hello", "Error"],
    answer: "HELLO",
  },
  // Unit 5 — Conditions
  {
    unit: 5,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["x = 5", "if x > 3:", "    print('Big')", "else:", "    print('Small')"],
    options: ["Big", "Small", "Big\nSmall", "Nothing"],
    answer: "Big",
  },
  // Unit 6 — Loops
  {
    unit: 6,
    type: "output",
    instruction: "How many times does this loop run?",
    codeLines: ["for i in range(4):", "    print(i)"],
    options: ["4", "3", "5", "Forever"],
    answer: "4",
  },
  // Unit 7 — Functions
  {
    unit: 7,
    type: "multiple_choice",
    instruction: "What keyword is used to define a function in Python?",
    options: ["def", "function", "fun", "create"],
    answer: "def",
  },
  // Unit 8 — Lists
  {
    unit: 8,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["fruits = ['apple', 'banana', 'cherry']", "print(fruits[1])"],
    options: ["banana", "apple", "cherry", "1"],
    answer: "banana",
  },
  // Unit 9 — Dictionaries
  {
    unit: 9,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["person = {'name': 'Alice', 'age': 25}", "print(person['age'])"],
    options: ["25", "Alice", "age", "Error"],
    answer: "25",
  },
  // Unit 10 — Files
  {
    unit: 10,
    type: "multiple_choice",
    instruction: "Which mode opens a file for reading in Python?",
    options: ["'r'", "'w'", "'a'", "'x'"],
    answer: "'r'",
  },
  // Unit 11 — Classes
  {
    unit: 11,
    type: "multiple_choice",
    instruction: "What does __init__ do in a Python class?",
    options: ["Sets up attributes when an object is created", "Deletes the object", "Prints the class", "Creates a loop"],
    answer: "Sets up attributes when an object is created",
  },
  // Unit 12 — Advanced
  {
    unit: 12,
    type: "output",
    instruction: "What does this code print?",
    codeLines: ["def add(a, b):", "    return a + b", "print(add(3, 7))"],
    options: ["10", "37", "a + b", "Error"],
    answer: "10",
  },
];

const UNIT_NAMES: Record<number, string> = {
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
};

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
  const [phase, setPhase] = useState<"intro" | "test" | "results">("intro");
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [placement, setPlacement] = useState(1);
  const [saving, setSaving] = useState(false);

  const question = PLACEMENT_QUESTIONS[current];
  const progress = (current / PLACEMENT_QUESTIONS.length) * 100;

  // Shuffle options every time a new question loads
  const shuffledOptions = question ? [...question.options].sort(() => Math.random() - 0.5) : [];

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);

    const correct = option === question.answer;
    setResults((prev) => [...prev, correct]);
  };

  const handleNext = () => {
    if (current + 1 >= PLACEMENT_QUESTIONS.length) {
      const place = getPlacement(results);
      setPlacement(place);
      setPhase("results");
    } else {
      setCurrent((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  };

  const handleStartFromPlacement = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const completedLessons: string[] = [];
      for (let u = 1; u < placement; u++) {
        for (let l = 1; l <= 5; l++) {
          completedLessons.push(`${u}-${l}`);
        }
      }

      const { data: existing } = await supabase
        .from("pico_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        await supabase
          .from("pico_progress")
          .update({ completed_lessons: JSON.stringify(completedLessons) })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("pico_progress")
          .insert({
            user_id: user.id,
            xp: 0,
            streak: 0,
            completed_lessons: JSON.stringify(completedLessons),
            language: "python",
          });
      }
    }

    setSaving(false);
    router.push(`/learn#unit-${placement}`);
  };

  const handleStartFromBeginning = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: existing } = await supabase
        .from("pico_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        await supabase
          .from("pico_progress")
          .insert({
            user_id: user.id,
            xp: 0,
            streak: 0,
            completed_lessons: JSON.stringify([]),
            language: "python",
          });
      }
    }

    setSaving(false);
    router.push("/learn");
  };

  const correctCount = results.filter(Boolean).length;

  if (phase === "intro") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center mb-4">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">What's your level?</h1>
            <p className="text-gray-500 font-semibold mb-8 leading-relaxed">
              Take a quick 12-question test to find out where to start. Or just begin from the very beginning.
            </p>

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
    const percentage = Math.round((correctCount / PLACEMENT_QUESTIONS.length) * 100);

    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">
                {percentage >= 80 ? "🎓" : percentage >= 50 ? "📚" : "🌱"}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              {percentage >= 80 ? "Great knowledge!" : percentage >= 50 ? "Good foundation!" : "Perfect starting point!"}
            </h1>

            <p className="text-gray-500 font-semibold mb-6">
              You got {correctCount} out of {PLACEMENT_QUESTIONS.length} correct
            </p>

            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8">
              <div
                className="h-4 bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
              <p className="text-green-600 text-xs font-extrabold uppercase tracking-wider mb-1">Your starting point</p>
              <p className="text-2xl font-extrabold text-gray-900">
                Unit {placement}: {UNIT_NAMES[placement]}
              </p>
              {placement > 1 && (
                <p className="text-gray-500 font-semibold text-sm mt-2">
                  Units 1–{placement - 1} will be unlocked automatically
                </p>
              )}
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {results.map((correct, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold ${correct ? "bg-green-500" : "bg-red-400"}`}
                >
                  {i + 1}
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
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setPhase("intro")} className="text-gray-400 hover:text-gray-600 font-extrabold text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition">
            ✕
          </button>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-3 bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-extrabold text-gray-400">{current + 1}/{PLACEMENT_QUESTIONS.length}</p>
        </div>
        <p className="text-xs font-extrabold text-green-500 uppercase tracking-wider mt-2">
          Unit {question.unit}: {UNIT_NAMES[question.unit]}
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 flex-1">
        <p className="text-xl font-extrabold text-gray-900 mb-6">{question.instruction}</p>

        {question.codeLines && (
          <div className="bg-gray-900 rounded-2xl p-4 mb-6">
            {question.codeLines.map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-600 font-mono text-sm w-4">{i + 1}</span>
                <span className="text-green-400 font-mono text-sm">{line}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {shuffledOptions.map((option, i) => {
            let style = "border-gray-200 border-b-gray-300 bg-white text-gray-800 hover:bg-gray-50";
            if (answered) {
              if (option === question.answer) style = "border-green-400 border-b-green-500 bg-green-50 text-green-700";
              else if (option === selectedOption) style = "border-red-400 border-b-red-500 bg-red-50 text-red-700";
            } else if (selectedOption === option) {
              style = "border-green-400 border-b-green-500 bg-green-50 text-green-700";
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                className={`w-full text-left px-6 py-4 rounded-2xl border-2 border-b-4 font-bold transition ${style}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`rounded-3xl p-5 mb-4 border-2 ${selectedOption === question.answer ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className={`font-extrabold ${selectedOption === question.answer ? "text-green-600" : "text-red-600"}`}>
              {selectedOption === question.answer ? "Correct!" : `Not quite — the answer is: ${question.answer}`}
            </p>
          </div>
        )}

        {answered && (
          <button
            onClick={handleNext}
            className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg mb-8"
          >
            {current + 1 >= PLACEMENT_QUESTIONS.length ? "See my results" : "Next question"}
          </button>
        )}
      </div>
    </main>
  );
}