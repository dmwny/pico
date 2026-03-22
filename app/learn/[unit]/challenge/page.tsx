"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const UNIT_CHALLENGES: Record<string, { title: string; description: string; prompt: string; exampleOutput: string }> = {
  "1": {
    title: "Hello World Challenge",
    description: "Use what you learned about print() and comments to complete this challenge.",
    prompt: `Write a Python program that:
1. Prints your name
2. Prints your age
3. Prints "I am learning Python!"
4. Has at least one comment explaining what your code does`,
    exampleOutput: `Alice
25
I am learning Python!`,
  },
  "2": {
    title: "Variables Challenge",
    description: "Use variables to store and display information.",
    prompt: `Write a Python program that:
1. Creates a variable called "name" with your name
2. Creates a variable called "age" with your age
3. Creates a variable called "city" with your city
4. Prints all three variables`,
    exampleOutput: `Alice
25
New York`,
  },
  "3": {
    title: "User Input Challenge",
    description: "Build a simple interactive program using input().",
    prompt: `Write a Python program that:
1. Asks the user for their name using input()
2. Asks the user for their favorite color
3. Prints a message combining both, like "Hi Alice! Your favorite color is blue."`,
    exampleOutput: `Hi Alice! Your favorite color is blue.`,
  },
  "4": {
    title: "Strings Challenge",
    description: "Use string operations to manipulate text.",
    prompt: `Write a Python program that:
1. Creates a variable with your full name
2. Prints your name in ALL CAPS
3. Prints how many characters are in your name
4. Prints a greeting using an f-string like "Hello, my name is Alice!"`,
    exampleOutput: `ALICE SMITH
11
Hello, my name is Alice Smith!`,
  },
  "5": {
    title: "Conditions Challenge",
    description: "Write a program that makes decisions.",
    prompt: `Write a Python program that:
1. Creates a variable called "score" with a number between 0 and 100
2. Prints "A" if score is 90 or above
3. Prints "B" if score is 80-89
4. Prints "C" if score is 70-79
5. Prints "F" if score is below 70`,
    exampleOutput: `B`,
  },
  "6": {
    title: "Loops Challenge",
    description: "Use loops to repeat code.",
    prompt: `Write a Python program that:
1. Uses a for loop to print the numbers 1 through 10
2. Uses a while loop to count down from 5 to 1
3. Prints "Blast off!" at the end`,
    exampleOutput: `1
2
3
4
5
6
7
8
9
10
5
4
3
2
1
Blast off!`,
  },
  "7": {
    title: "Functions Challenge",
    description: "Write and use your own functions.",
    prompt: `Write a Python program that:
1. Defines a function called "greet" that takes a name and prints "Hello, [name]!"
2. Defines a function called "add" that takes two numbers and returns their sum
3. Calls greet() with your name
4. Calls add() with two numbers and prints the result`,
    exampleOutput: `Hello, Alice!
15`,
  },
  "8": {
    title: "Lists Challenge",
    description: "Work with lists of data.",
    prompt: `Write a Python program that:
1. Creates a list of 5 of your favorite foods
2. Prints the first and last item in the list
3. Adds a new food to the list
4. Prints how many items are in the list
5. Loops through the list and prints each item`,
    exampleOutput: `pizza
sushi
6
pizza
burger
tacos
ramen
sushi
ice cream`,
  },
  "9": {
    title: "Dictionaries Challenge",
    description: "Use dictionaries to store structured data.",
    prompt: `Write a Python program that:
1. Creates a dictionary called "person" with keys: name, age, city, hobby
2. Prints each value using its key
3. Adds a new key called "language" with value "Python"
4. Prints all keys and values using a loop`,
    exampleOutput: `Alice
25
New York
coding
name: Alice
age: 25
city: New York
hobby: coding
language: Python`,
  },
  "10": {
    title: "File Handling Challenge",
    description: "Read and write files.",
    prompt: `Write a Python program that:
1. Creates a file called "notes.txt" and writes three lines to it
2. Closes the file
3. Opens the file again and reads all the content
4. Prints the content`,
    exampleOutput: `Line 1
Line 2
Line 3`,
  },
  "11": {
    title: "Classes Challenge",
    description: "Build your own class.",
    prompt: `Write a Python program that:
1. Defines a class called "Dog" with attributes: name, breed, age
2. Adds a method called "bark" that prints "[name] says: Woof!"
3. Adds a method called "info" that prints the dog's name, breed and age
4. Creates two Dog objects and calls both methods on each`,
    exampleOutput: `Rex says: Woof!
Name: Rex, Breed: Labrador, Age: 3
Buddy says: Woof!
Name: Buddy, Breed: Poodle, Age: 5`,
  },
  "12": {
    title: "Final Project Challenge",
    description: "Build a complete Python program using everything you learned.",
    prompt: `Build a simple contact book program that:
1. Has a dictionary to store contacts (name -> phone number)
2. Has a function to add a contact
3. Has a function to look up a contact by name
4. Has a function to display all contacts
5. Demonstrates all three functions working`,
    exampleOutput: `Contact added: Alice - 555-1234
Looking up Alice: 555-1234
All contacts:
Alice: 555-1234
Bob: 555-5678`,
  },
};

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unit as string;

  const challenge = UNIT_CHALLENGES[unitId];
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);

  const checkCode = async () => {
    if (!code.trim()) return;
    setChecking(true);

    const res = await fetch("/api/challenge-check", {
      method: "POST",
      body: JSON.stringify({
        prompt: challenge.prompt,
        exampleOutput: challenge.exampleOutput,
        userCode: code,
      }),
    });
    const data = await res.json();
    setFeedback(data);
    setChecking(false);

    if (data.correct) {
      await saveProgress();
      setDone(true);
    }
  };

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lessonKey = `${unitId}-5`;

    const { data: existing } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const completed = JSON.parse(existing.completed_lessons || "[]");
      if (!completed.includes(lessonKey)) {
        completed.push(lessonKey);
      }
      await supabase
        .from("pico_progress")
        .update({
          xp: existing.xp + 50,
          completed_lessons: JSON.stringify(completed),
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("pico_progress")
        .insert({
          user_id: user.id,
          xp: 50,
          streak: 0,
          completed_lessons: JSON.stringify([lessonKey]),
          language: "python",
        });
    }
  };

  if (!challenge) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-semibold">Challenge not found.</p>
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
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Unit Complete!</h2>
          <p className="text-gray-500 font-semibold mb-2">You earned 50 XP</p>
          <p className="text-green-500 font-extrabold mb-8">Next unit unlocked!</p>
          <button
            onClick={() => router.push("/learn")}
            className="bg-green-500 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-600 transition shadow-md w-full"
          >
            Continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/learn")}
          className="text-gray-400 hover:text-gray-600 font-bold mb-8 block"
        >
          Back
        </button>

        <div className="bg-yellow-400 rounded-3xl p-6 mb-6 shadow-md">
          <p className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Unit Challenge</p>
          <h1 className="text-2xl font-extrabold text-white">{challenge.title}</h1>
          <p className="text-yellow-100 font-semibold mt-1">{challenge.description}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Your task</h2>
          <pre className="text-gray-700 font-semibold text-sm whitespace-pre-wrap leading-relaxed">
            {challenge.prompt}
          </pre>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Expected output</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-2xl text-sm font-mono overflow-x-auto">
            {challenge.exampleOutput}
          </pre>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 mb-3">Write your code</h2>
          <textarea
            className="w-full h-48 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            placeholder="# Write your Python code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {feedback && !feedback.correct && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-4">
            <p className="font-extrabold text-red-600 text-lg mb-1">Not quite!</p>
            <p className="text-red-700 font-semibold">{feedback.explanation}</p>
            {feedback.hint && (
              <p className="text-red-600 font-bold mt-2 text-sm">Hint: {feedback.hint}</p>
            )}
          </div>
        )}

        <button
          onClick={checkCode}
          disabled={checking || !code.trim()}
          className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-lg"
        >
          {checking ? "Checking your code..." : "Submit Code"}
        </button>
      </div>
    </main>
  );
}
