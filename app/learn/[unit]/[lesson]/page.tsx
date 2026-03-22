"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LESSON_TOPICS: Record<string, Record<string, string>> = {
  "1": {
    "1": "the print() function in Python — how to display text on the screen using print('hello')",
    "2": "printing numbers in Python using print() with integers and floats like print(42)",
    "3": "printing multiple things in Python using commas in print() like print('hello', 'world')",
    "4": "comments in Python using the # symbol to write notes in code",
  },
  "2": {
    "1": "creating variables in Python like name = 'Alice' or age = 25",
    "2": "rules for naming variables in Python — no spaces, no special characters, case sensitive",
    "3": "changing a variable value in Python by reassigning it",
    "4": "printing variables in Python using print(variable_name)",
  },
  "3": {
    "1": "the input() function in Python — how to get text from the user using input('Enter your name: ')",
    "2": "storing user input in a variable like name = input('Your name: ')",
    "3": "converting input to a number using int(input()) or float(input())",
    "4": "using input values inside print() statements",
  },
  "4": {
    "1": "joining strings in Python using the + operator like 'hello' + ' world'",
    "2": "string length in Python using the len() function",
    "3": "upper() and lower() string methods in Python",
    "4": "f-strings in Python like f'Hello {name}' to insert variables into strings",
  },
  "5": {
    "1": "if statements in Python to run code only when a condition is True",
    "2": "else statements in Python to run code when the if condition is False",
    "3": "elif statements in Python to check multiple conditions",
    "4": "combining conditions in Python using and, or, not",
  },
  "6": {
    "1": "while loops in Python to repeat code while a condition is True",
    "2": "for loops in Python to repeat code a set number of times",
    "3": "the range() function in Python for loops like for i in range(5)",
    "4": "break and continue in Python to control loops",
  },
  "7": {
    "1": "defining a function in Python using the def keyword like def greet():",
    "2": "calling a function in Python by writing its name like greet()",
    "3": "function parameters in Python like def add(a, b):",
    "4": "return values in Python using the return keyword",
  },
  "8": {
    "1": "creating a list in Python like fruits = ['apple', 'banana', 'cherry']",
    "2": "accessing list items in Python using index like fruits[0]",
    "3": "adding and removing items from a list using append() and remove()",
    "4": "looping through a list in Python using a for loop",
  },
  "9": {
    "1": "creating a dictionary in Python like person = {'name': 'Alice', 'age': 25}",
    "2": "accessing dictionary values in Python using keys like person['name']",
    "3": "adding and updating dictionary entries in Python",
    "4": "looping through a dictionary in Python using for key in dict",
  },
  "10": {
    "1": "opening a file in Python using open() with read mode 'r' or write mode 'w'",
    "2": "reading a file in Python using file.read() or file.readlines()",
    "3": "writing to a file in Python using file.write()",
    "4": "closing files properly in Python using file.close() or with open()",
  },
  "11": {
    "1": "defining a class in Python using the class keyword like class Dog:",
    "2": "the __init__ method in Python classes to set up attributes",
    "3": "class attributes in Python using self.name = name",
    "4": "class methods in Python — functions that belong to a class",
  },
  "12": {
    "1": "planning a Python project — breaking a problem into small steps before writing any code",
    "2": "building the structure of a Python program using functions and variables together",
    "3": "adding features to a Python program step by step using everything learned so far",
    "4": "testing and fixing bugs in a Python program using print statements and logic checks",
  },
};

const TOTAL_QUESTIONS = 4;

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unit as string;
  const lessonId = params.lesson as string;

  const [phase, setPhase] = useState<"teaching" | "quiz">("teaching");
  const [teaching, setTeaching] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(3);
  const [done, setDone] = useState(false);

  // Arrange state
  const [arrangedTiles, setArrangedTiles] = useState<string[]>([]);
  const [availableArrangeTiles, setAvailableArrangeTiles] = useState<string[]>([]);

  // Fill state
  const [selectedFill, setSelectedFill] = useState<string | null>(null);

  // Multiple choice / output state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const topic = LESSON_TOPICS[unitId]?.[lessonId] || "Python basics";

  useEffect(() => {
    loadLesson();
  }, []);

  useEffect(() => {
    if (questions[current]?.type === "arrange") {
      const shuffled = [...(questions[current].tiles || [])].sort(() => Math.random() - 0.5);
      setAvailableArrangeTiles(shuffled);
      const blanks = (questions[current].codeLines || []).join("").split(/_{2,}/).length - 1;
      setArrangedTiles(new Array(blanks).fill(""));
    }
  }, [current, questions]);

  const loadLesson = async () => {
  setLoading(true);
  const res = await fetch("/api/lesson", {
    method: "POST",
    body: JSON.stringify({ topic, unitId, lessonId, count: TOTAL_QUESTIONS }),
  });
    const data = await res.json();
    setTeaching(data.teaching);
    setQuestions(data.questions || []);
    setLoading(false);
  };

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lessonKey = `${unitId}-${lessonId}`;
    const { data: existing } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const completed = JSON.parse(existing.completed_lessons || "[]");
      if (!completed.includes(lessonKey)) completed.push(lessonKey);
      await supabase
        .from("pico_progress")
        .update({ xp: existing.xp + xp, completed_lessons: JSON.stringify(completed) })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("pico_progress")
        .insert({ user_id: user.id, xp, streak: 0, completed_lessons: JSON.stringify([lessonKey]), language: "python" });
    }
  };

  const checkAnswer = async () => {
    const q = questions[current];
    let userAnswer = "";
    if (q.type === "arrange") userAnswer = arrangedTiles.join(" ");
    else if (q.type === "fill") userAnswer = selectedFill || "";
    else userAnswer = selectedOption || "";

    if (!userAnswer.trim()) return;
    setChecking(true);

    const res = await fetch("/api/check-lesson", {
      method: "POST",
      body: JSON.stringify({
        question: q.instruction,
        correctAnswer: Array.isArray(q.answer) ? q.answer.join(" ") : q.answer,
        userAnswer,
      }),
    });
    const data = await res.json();
    setFeedback({ ...data, explanation: q.explanation });
    setChecking(false);

    if (data.correct) {
      setXp((prev) => prev + 10);
    } else {
      setLives((prev) => Math.max(0, prev - 1));
    }
  };

  const next = async () => {
    if (current + 1 >= TOTAL_QUESTIONS) {
      await saveProgress();
      setDone(true);
    } else {
      setCurrent((prev) => prev + 1);
      setFeedback(null);
      setSelectedFill(null);
      setSelectedOption(null);
      setArrangedTiles([]);
    }
  };

  const progress = (current / TOTAL_QUESTIONS) * 100;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Loading lesson...</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Lesson Complete!</h2>
          <p className="text-gray-500 font-semibold mb-2">You earned {xp} XP</p>
          <button onClick={() => router.push(`/learn#unit-${unitId}`)}className="mt-6 bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full">
            Continue
          </button>
        </div>
      </main>
    );
  }

  if (lives === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Out of hearts!</h2>
          <p className="text-gray-500 font-semibold mb-8">Practice makes perfect. Try again!</p>
          <button
            onClick={() => { setLives(3); setCurrent(0); setFeedback(null); setSelectedFill(null); setSelectedOption(null); setArrangedTiles([]); loadLesson(); }}
            className="bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (phase === "teaching" && teaching) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full">
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-4">
            <p className="text-xs font-extrabold text-green-500 uppercase tracking-wider mb-4">New concept</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">{teaching.title}</h2>
            <p className="text-gray-600 font-semibold text-lg leading-relaxed mb-6">{teaching.explanation}</p>
            {teaching.example && (
              <div className="mb-6">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Example</p>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-base font-mono overflow-x-auto">{teaching.example}</pre>
              </div>
            )}
            {teaching.tip && (
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4">
                <p className="text-blue-700 font-bold text-sm">{teaching.tip}</p>
              </div>
            )}
          </div>
          <button onClick={() => setPhase("quiz")} className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md text-lg">
            Got it, let me practice
          </button>
        </div>
      </main>
    );
  }

  const question = questions[current];

  // Render code lines with blanks filled by arranged tiles
  const renderArrangeCodeLines = () => {
    if (!question?.codeLines) return null;
    let blankIndex = 0;
    return question.codeLines.map((line: string, lineIdx: number) => {
      const parts = line.split(/_{2,}/);
      return (
        <div key={lineIdx} className="flex items-center gap-1 flex-wrap">
          <span className="text-gray-500 font-mono text-sm mr-2">{lineIdx + 1}</span>
          {parts.map((part: string, partIdx: number) => {
            const currentBlankIndex = blankIndex;
            if (partIdx < parts.length - 1) blankIndex++;
            return (
              <span key={partIdx} className="flex items-center gap-1">
                <span className="text-green-400 font-mono text-sm">{part}</span>
                {partIdx < parts.length - 1 && (
                  <span
                    className={`inline-block min-w-12 px-2 py-0.5 rounded-lg text-center font-bold font-mono text-sm cursor-pointer ${
                      arrangedTiles[currentBlankIndex]
                        ? "bg-green-500 text-white"
                        : "bg-gray-700 text-gray-400 border-2 border-dashed border-gray-600"
                    }`}
                    onClick={() => {
                      if (feedback) return;
                      if (arrangedTiles[currentBlankIndex]) {
                        const tile = arrangedTiles[currentBlankIndex];
                        setArrangedTiles((prev) => {
                          const next = [...prev];
                          next[currentBlankIndex] = "";
                          return next;
                        });
                        setAvailableArrangeTiles((prev) => [...prev, tile]);
                      }
                    }}
                  >
                    {arrangedTiles[currentBlankIndex] || "___"}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      );
    });
  };

  const totalBlanks = question?.codeLines?.join("").split(/_{2,}/).length - 1 || 0;
  const allBlanksFilled = arrangedTiles.filter(Boolean).length >= totalBlanks;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push(`/learn#unit-${unitId}`)}className="text-gray-400 hover:text-gray-600 font-extrabold text-xl w-8 h-8 flex items-center justify-center">
            x
          </button>
          <div className="flex-1 mx-4 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-4 bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${i < lives ? "text-red-500" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 flex-1">
        <p className="text-xl font-extrabold text-gray-900 mb-6">{question?.instruction}</p>

        {/* ARRANGE */}
        {question?.type === "arrange" && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">Fill in the blanks</p>
            <div className="bg-gray-900 rounded-2xl p-4 mb-6 space-y-2">
              {renderArrangeCodeLines()}
            </div>
            {!feedback && (
              <div className="flex flex-wrap gap-2">
                {availableArrangeTiles.map((tile, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const nextEmpty = arrangedTiles.findIndex((t, idx) => idx < totalBlanks && !t);
                      if (nextEmpty === -1) {
                        setArrangedTiles((prev) => {
                          const next = [...prev];
                          next[totalBlanks - 1] = tile;
                          return next;
                        });
                      } else {
                        setArrangedTiles((prev) => {
                          const next = [...prev];
                          next[nextEmpty] = tile;
                          return next;
                        });
                      }
                      setAvailableArrangeTiles((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="bg-white border-2 border-b-4 border-gray-300 text-gray-800 font-bold font-mono px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition active:border-b-2 active:translate-y-0.5"
                  >
                    {tile}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FILL */}
        {question?.type === "fill" && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <div className="bg-gray-900 rounded-2xl p-4 mb-6">
              {question.codeLines?.map((line: string, i: number) => (
                <div key={i} className="flex items-center gap-1 flex-wrap">
                  <span className="text-gray-500 font-mono text-sm mr-2">{i + 1}</span>
                  {line.split("___").map((part: string, j: number) => (
                    <span key={j} className="flex items-center gap-1">
                      <span className="text-green-400 font-mono text-sm">{part}</span>
                      {j < line.split("___").length - 1 && (
                        <span className={`inline-block min-w-16 px-2 py-0.5 rounded-lg mx-1 text-center font-bold font-mono text-sm ${selectedFill ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400 border-2 border-dashed border-gray-600"}`}>
                          {selectedFill || "___"}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            {!feedback && (
              <div className="flex flex-wrap gap-2">
                {question.tiles?.map((tile: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFill(tile)}
                    className={`border-2 border-b-4 font-bold font-mono px-4 py-2 rounded-xl text-sm transition active:border-b-2 active:translate-y-0.5 ${
                      selectedFill === tile ? "border-green-400 bg-green-50 text-green-700" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {tile}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MULTIPLE CHOICE / OUTPUT */}
        {(question?.type === "multiple_choice" || question?.type === "output") && (
          <div className="space-y-3 mb-4">
            {question?.codeLines && (
              <div className="bg-gray-900 rounded-2xl p-4 mb-4">
                {question.codeLines.map((line: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-gray-500 font-mono text-sm">{i + 1}</span>
                    <span className="text-green-400 font-mono text-sm">{line}</span>
                  </div>
                ))}
              </div>
            )}
            {question?.options?.map((option: string, i: number) => (
              <button
                key={i}
                onClick={() => !feedback && setSelectedOption(option)}
                className={`w-full text-left px-6 py-4 rounded-2xl border-2 border-b-4 font-bold transition active:border-b-2 active:translate-y-0.5 ${
                  selectedOption === option ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* FEEDBACK */}
        {feedback && (
          <div className={`rounded-3xl p-6 mb-4 ${feedback.correct ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}>
            <p className={`font-extrabold text-lg mb-1 ${feedback.correct ? "text-green-600" : "text-red-600"}`}>
              {feedback.correct ? "Correct!" : "Not quite"}
            </p>
            <p className={`font-semibold ${feedback.correct ? "text-green-700" : "text-red-700"}`}>
              {feedback.explanation}
            </p>
            {!feedback.correct && (
              <p className="text-red-600 font-bold mt-2 text-sm">
                Correct answer: <span className="font-mono bg-red-100 px-2 py-1 rounded-lg">
                  {Array.isArray(questions[current]?.answer)
                    ? questions[current].answer.join(" ")
                    : questions[current]?.answer}
                </span>
              </p>
            )}
            {feedback.correct && question?.consoleOutput && (
              <div className="mt-4">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Console output</p>
                <div className="bg-gray-900 rounded-2xl p-4">
                  <p className="text-green-400 font-mono text-sm">{question.consoleOutput}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={feedback ? next : checkAnswer}
          disabled={checking || (!feedback && !selectedFill && !selectedOption && (question?.type === "arrange" ? !allBlanksFilled : false))}
          className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-lg mb-8"
        >
          {checking ? "Checking..." : feedback ? "Continue" : "Check"}
        </button>
      </div>
    </main>
  );
}