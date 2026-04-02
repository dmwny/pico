"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Pico from "@/components/Pico";
import {
  fillApiMiniCourseCode,
  getApiMiniCourse,
  getApiMiniCourseKey,
  getApiMiniCourseLesson,
  getApiMiniCourseLessons,
  getCompletedApiMiniCourseKeys,
  isApiMiniCourseLessonUnlocked,
  type ApiMiniCourseLesson,
  type ApiMiniCourseStage,
} from "@/lib/apiMiniCourses";
import { type LearningLanguage } from "@/lib/courseContent";

function parseCompletedLessons(raw: unknown) {
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTypedCode(value: string) {
  return value
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

function getBlankLineIndex(codeLines: string[]) {
  return codeLines.findIndex((line) => line.includes("___"));
}

function buildFilledLineChallenge(lesson: ApiMiniCourseLesson) {
  const blankLineIndex = getBlankLineIndex(lesson.codeLines);
  const filledCode = fillApiMiniCourseCode(lesson.codeLines, lesson.answer, lesson.previewDefaults);
  return {
    blankLineIndex,
    filledCode,
    completedLine: blankLineIndex >= 0 ? filledCode[blankLineIndex] : filledCode[filledCode.length - 1] ?? "",
  };
}

function buildTypedStages(lesson: ApiMiniCourseLesson): ApiMiniCourseStage[] {
  const { filledCode, completedLine } = buildFilledLineChallenge(lesson);

  return [
    {
      id: "typed-line",
      kind: "typed",
      prompt: "Type the completed line from scratch.",
      note: "Write the full line without using the tiles.",
      codeLines: lesson.codeLines,
      expected: completedLine,
      placeholder: completedLine.replace(/[A-Za-z0-9]/g, "•"),
      previewDefaults: lesson.answer,
      challengeType: "line",
    },
    {
      id: "typed-block",
      kind: "typed",
      prompt: "Type the full code block from scratch.",
      note: "Rebuild the whole snippet so the preview matches the goal.",
      codeLines: lesson.codeLines,
      expected: filledCode.join("\n"),
      placeholder: filledCode.map(() => "•").join("\n"),
      previewDefaults: lesson.answer,
      challengeType: "block",
    },
  ];
}

function getTypedStagePlaceholder(stage: ApiMiniCourseStage | null) {
  if (!stage || stage.kind !== "typed") return "";
  return stage.challengeType === "line" ? "Type one line of code here" : "Type the full code block here";
}

function isStartFromZeroChallenge(stage: ApiMiniCourseStage | null) {
  return Boolean(stage && stage.kind === "typed" && stage.challengeType === "block");
}

function getStageLabel(stage: ApiMiniCourseStage | null) {
  if (!stage) return "Lesson step";
  if (isStartFromZeroChallenge(stage)) return "Challenge";
  if (stage.kind === "typed") return "Code step";
  return "Lesson step";
}

function buildAuthoredApiStages(lesson: ApiMiniCourseLesson): ApiMiniCourseStage[] | null {
  const typedStages = buildTypedStages(lesson);

  switch (lesson.previewKind) {
    case "random-randint":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "module",
          kind: "tiles",
          prompt: "Choose the Python module that provides randint.",
          note: "randint belongs to Python's random module.",
          codeLines: ["import ___", "roll = random.randint(1, 6)", "print(roll)"],
          tiles: ["random", "math", "time"],
          answer: ["random"],
          previewDefaults: [],
        },
        {
          id: "function",
          kind: "tiles",
          prompt: "Choose the function name that rolls a number between two limits.",
          note: "randint uses a low value first and a high value second.",
          codeLines: ["import random", "roll = random.___(1, 6)", "print(roll)"],
          tiles: ["randint", "choice", "shuffle"],
          answer: ["randint"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "random-choice":
    case "random-coin":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "module",
          kind: "tiles",
          prompt: "Choose the Python module that picks random items.",
          note: "choice is part of the random module.",
          codeLines: ["import ___", 'color = random.choice(["red", "blue", "green"])', "print(color)"],
          tiles: ["random", "math", "os"],
          answer: ["random"],
          previewDefaults: [],
        },
        {
          id: "list-shape",
          kind: "tiles",
          prompt: "Choose the brackets that make a list of options.",
          note: "choice needs a list to pick from.",
          codeLines: ["import random", "color = random.choice___", "print(color)"],
          tiles: ['(["red", "blue", "green"])', '("red", "blue", "green")', '{"red", "blue", "green"}'],
          answer: ['(["red", "blue", "green"])'],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "random-shuffle":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "module",
          kind: "tiles",
          prompt: "Choose the module that provides shuffle.",
          note: "shuffle is another helper from Python's random module.",
          codeLines: ["import ___", "cards = [1, 2, 3, 4]", "random.shuffle(cards)"],
          tiles: ["random", "array", "cards"],
          answer: ["random"],
          previewDefaults: [],
        },
        {
          id: "target-list",
          kind: "tiles",
          prompt: "Choose the list that should be shuffled in place.",
          note: "shuffle changes the existing list instead of returning a new one.",
          codeLines: ["import random", "cards = [1, 2, 3, 4]", "random.shuffle(___)", "print(cards)"],
          tiles: ["cards", "random", "print"],
          answer: ["cards"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "fetch-request":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "await",
          kind: "tiles",
          prompt: "Choose the keyword that waits for the request to finish.",
          note: "fetch returns a promise, so await pauses until the response arrives.",
          codeLines: ["const response = ___ fetch('/api/posts')"],
          tiles: ["await", "return", "async"],
          answer: ["await"],
          previewDefaults: [],
        },
        {
          id: "url",
          kind: "tiles",
          prompt: "Choose the endpoint string used in this request.",
          note: "The URL tells fetch which route to call.",
          codeLines: ["const response = await fetch(___)"],
          tiles: ["'/api/posts'", "'/api/users'", "'/posts'"],
          answer: ["'/api/posts'"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "fetch-json":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "source",
          kind: "tiles",
          prompt: "Choose the response object that owns the json method.",
          note: "The body parser is called on the response returned by fetch.",
          codeLines: ["const response = await fetch('/api/posts')", "const data = await ___.json()"],
          tiles: ["response", "data", "fetch"],
          answer: ["response"],
          previewDefaults: [],
        },
        {
          id: "data-name",
          kind: "tiles",
          prompt: "Choose the variable name used for the parsed result.",
          note: "After parsing, the JSON body is stored in data.",
          codeLines: ["const response = await fetch('/api/posts')", "const ___ = await response.json()"],
          tiles: ["data", "body", "post"],
          answer: ["data"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "fetch-title":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "first-post",
          kind: "tiles",
          prompt: "Choose the index for the first post in the array.",
          note: "Arrays start at index 0 in JavaScript.",
          codeLines: ["const data = [{ title: 'Launch' }]", "console.log(data[___].title)"],
          tiles: ["0", "1", "2"],
          answer: ["0"],
          previewDefaults: [],
        },
        {
          id: "source-array",
          kind: "tiles",
          prompt: "Choose the variable that stores the post array.",
          note: "data is the array returned from the parsed response.",
          codeLines: ["const data = [{ title: 'Launch' }]", "console.log(___[0].title)"],
          tiles: ["data", "title", "post"],
          answer: ["data"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "fetch-post":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "options-key",
          kind: "tiles",
          prompt: "Choose the options key that sets the HTTP method.",
          note: "The method property tells fetch which type of request to send.",
          codeLines: ["await fetch('/api/posts', {", "  ___: 'POST'", "})"],
          tiles: ["method", "body", "headers"],
          answer: ["method"],
          previewDefaults: [],
        },
        {
          id: "request-verb",
          kind: "tiles",
          prompt: "Choose the HTTP verb used to create a new record.",
          note: "POST is commonly used to create new items on the server.",
          codeLines: ["await fetch('/api/posts', {", "  method: '___'", "})"],
          tiles: ["POST", "GET", "DELETE"],
          answer: ["POST"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "canvas-rect":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "context",
          kind: "tiles",
          prompt: "Choose the canvas method that gives you the 2D drawing context.",
          note: "getContext('2d') unlocks the drawing commands on the canvas.",
          codeLines: ["const ctx = canvas.___('2d')", "ctx.fillRect(40, 60, 140, 80)"],
          tiles: ["getContext", "fillRect", "querySelector"],
          answer: ["getContext"],
          previewDefaults: [],
        },
        {
          id: "method",
          kind: "tiles",
          prompt: "Choose the drawing method that fills a rectangle immediately.",
          note: "fillRect uses x, y, width, and height in that order.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.___(40, 60, 140, 80)"],
          tiles: ["fillRect", "clearRect", "arc"],
          answer: ["fillRect"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "canvas-color":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "style-prop",
          kind: "tiles",
          prompt: "Choose the property that sets the fill color for later shapes.",
          note: "fillStyle changes the color before you call fillRect.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.___ = 'coral'", "ctx.fillRect(40, 60, 140, 80)"],
          tiles: ["fillStyle", "strokeStyle", "lineWidth"],
          answer: ["fillStyle"],
          previewDefaults: [],
        },
        {
          id: "draw-after-style",
          kind: "tiles",
          prompt: "Choose the method that uses the new fill color on the canvas.",
          note: "Once fillStyle is set, fillRect will draw with that color.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.fillStyle = 'coral'", "ctx.___(40, 60, 140, 80)"],
          tiles: ["fillRect", "clearRect", "stroke"],
          answer: ["fillRect"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "canvas-circle":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "path-start",
          kind: "tiles",
          prompt: "Choose the method that starts a fresh drawing path.",
          note: "beginPath keeps this circle separate from older shapes.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.___()", "ctx.arc(150, 110, 40, 0, Math.PI * 2)", "ctx.fill()"],
          tiles: ["beginPath", "fillRect", "strokeStyle"],
          answer: ["beginPath"],
          previewDefaults: [],
        },
        {
          id: "circle-method",
          kind: "tiles",
          prompt: "Choose the method that draws a circular path.",
          note: "arc uses center x, center y, radius, start angle, and end angle.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.beginPath()", "ctx.___(150, 110, 40, 0, Math.PI * 2)", "ctx.fill()"],
          tiles: ["arc", "lineTo", "clearRect"],
          answer: ["arc"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "canvas-clear":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "erase-method",
          kind: "tiles",
          prompt: "Choose the method that erases part of the canvas.",
          note: "clearRect removes pixels inside the rectangle area you pass in.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.fillRect(20, 20, 180, 120)", "ctx.___(60, 40, 60, 40)"],
          tiles: ["clearRect", "fillRect", "strokeRect"],
          answer: ["clearRect"],
          previewDefaults: [],
        },
        {
          id: "clear-height",
          kind: "tiles",
          prompt: "Choose the height used for the cleared block.",
          note: "clearRect uses x, y, width, then height.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.fillRect(20, 20, 180, 120)", "ctx.clearRect(60, 40, 60, ___)"],
          tiles: ["40", "60", "120"],
          answer: ["40"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "canvas-line":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "start-line",
          kind: "tiles",
          prompt: "Choose the method that sets the starting point of the line.",
          note: "moveTo sets where the pen starts before lineTo draws to a new point.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.beginPath()", "ctx.___(40, 40)", "ctx.lineTo(220, 160)", "ctx.stroke()"],
          tiles: ["moveTo", "lineTo", "stroke"],
          answer: ["moveTo"],
          previewDefaults: [],
        },
        {
          id: "draw-line",
          kind: "tiles",
          prompt: "Choose the method that draws from the start point to the end point.",
          note: "lineTo adds a new endpoint to the current path.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.beginPath()", "ctx.moveTo(40, 40)", "ctx.___(220, 160)", "ctx.stroke()"],
          tiles: ["lineTo", "fillRect", "arc"],
          answer: ["lineTo"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "canvas-stroke-color":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "stroke-prop",
          kind: "tiles",
          prompt: "Choose the property that changes the line color.",
          note: "strokeStyle affects lines and stroked shapes instead of fills.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.___ = 'purple'", "ctx.beginPath()"],
          tiles: ["strokeStyle", "fillStyle", "lineCap"],
          answer: ["strokeStyle"],
          previewDefaults: [],
        },
        {
          id: "finish-line",
          kind: "tiles",
          prompt: "Choose the method that actually paints the path outline.",
          note: "stroke draws the path using the current strokeStyle.",
          codeLines: ["const ctx = canvas.getContext('2d')", "ctx.strokeStyle = 'purple'", "ctx.beginPath()", "ctx.moveTo(40, 40)", "ctx.lineTo(220, 160)", "ctx.___()"],
          tiles: ["stroke", "fill", "clearRect"],
          answer: ["stroke"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "dom-select":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "selector",
          kind: "tiles",
          prompt: "Choose the selector string that targets the status id.",
          note: "An id selector starts with # in CSS and querySelector.",
          codeLines: ["const statusEl = document.querySelector(___)"],
          tiles: ["'#status'", "'.status'", "'status'"],
          answer: ["'#status'"],
          previewDefaults: [],
        },
        {
          id: "document-object",
          kind: "tiles",
          prompt: "Choose the browser object you call querySelector on.",
          note: "document represents the current page.",
          codeLines: ["const statusEl = ___.querySelector('#status')"],
          tiles: ["document", "window", "statusEl"],
          answer: ["document"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "dom-text":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "value",
          kind: "tiles",
          prompt: "Choose the text that should appear inside the status element.",
          note: "The string on the right side becomes the visible label.",
          codeLines: ["const statusEl = document.querySelector('#status')", "statusEl.textContent = ___"],
          tiles: ["'Ready'", "'Loading'", "'Saved'"],
          answer: ["'Ready'"],
          previewDefaults: [],
        },
        {
          id: "element-var",
          kind: "tiles",
          prompt: "Choose the variable that stores the selected status element.",
          note: "You update the element after storing it in statusEl.",
          codeLines: ["const statusEl = document.querySelector('#status')", "___.textContent = 'Ready'"],
          tiles: ["statusEl", "document", "button"],
          answer: ["statusEl"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "dom-click":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "event-name",
          kind: "tiles",
          prompt: "Choose the browser event name for pressing the button.",
          note: "The click event fires when the user activates the button.",
          codeLines: ["const button = document.querySelector('button')", "button.addEventListener(___, () => {", "  console.log('Saved')", "})"],
          tiles: ["'click'", "'submit'", "'keydown'"],
          answer: ["'click'"],
          previewDefaults: [],
        },
        {
          id: "target",
          kind: "tiles",
          prompt: "Choose the variable that should listen for the event.",
          note: "The handler is attached to the button element itself.",
          codeLines: ["const button = document.querySelector('button')", "___.addEventListener('click', () => {", "  console.log('Saved')", "})"],
          tiles: ["button", "document", "statusEl"],
          answer: ["button"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "dom-class":
    case "dom-value":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "target",
          kind: "tiles",
          prompt:
            lesson.previewKind === "dom-class"
              ? "Choose the element variable that gets the new class."
              : "Choose the element variable that stores the typed text.",
          note:
            lesson.previewKind === "dom-class"
              ? "classList belongs to the selected element."
              : "value is read from the selected input element.",
          codeLines:
            lesson.previewKind === "dom-class"
              ? ["const statusEl = document.querySelector('#status')", "___.classList.add('success')"]
              : ["const nameInput = document.querySelector('input')", "console.log(___.value)"],
          tiles: lesson.previewKind === "dom-class" ? ["statusEl", "document", "button"] : ["nameInput", "document", "statusEl"],
          answer: [lesson.previewKind === "dom-class" ? "statusEl" : "nameInput"],
          previewDefaults: [],
        },
        {
          id: "concept",
          kind: "tiles",
          prompt:
            lesson.previewKind === "dom-class"
              ? "Choose the property that manages classes on an element."
              : "Choose the property that reads the current input text.",
          note:
            lesson.previewKind === "dom-class"
              ? "classList gives you add, remove, and toggle."
              : "value holds the live text from an input element.",
          codeLines:
            lesson.previewKind === "dom-class"
              ? ["const statusEl = document.querySelector('#status')", "statusEl.___.add('success')"]
              : ["const nameInput = document.querySelector('input')", "console.log(nameInput.___)"],
          tiles: lesson.previewKind === "dom-class" ? ["classList", "textContent", "style"] : ["value", "textContent", "className"],
          answer: [lesson.previewKind === "dom-class" ? "classList" : "value"],
          previewDefaults: [],
        },
        ...typedStages,
      ];
    default:
      break;
  }

  switch (lesson.title) {
    case "Pick a Button":
    case "Pick a Panel":
    case "Query Status":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "query-method",
          kind: "tiles",
          prompt: "Choose the DOM method that finds one matching element.",
          note: "querySelector returns the first element that matches the selector.",
          codeLines: ["const element = ___('#status')"],
          tiles: ["document.querySelector", "document.createElement", "document.appendChild"],
          answer: ["document.querySelector"],
          previewDefaults: [],
        },
        {
          id: "selector-shape",
          kind: "tiles",
          prompt: "Choose the correct selector text for this element.",
          note: "Button tags use button. Id selectors start with #.",
          codeLines: ["const element = document.querySelector(___)"],
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: [],
        },
        ...typedStages,
      ];
    case "Set Text":
    case "Read Title":
    case "Read Status":
    case "Check Status":
    case "Check Ok":
    case "Read a Field":
    case "Read Input Value":
    case "Read a Value":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "source",
          kind: "tiles",
          prompt: "Choose the object or variable that owns the value you want to read.",
          note: "Read the property from the object that already stores the data.",
          codeLines: [lesson.codeLines[0], lesson.codeLines[lesson.codeLines.length - 1].replace("___", lesson.answer[0])],
          tiles: [
            lesson.codeLines[lesson.codeLines.length - 1].includes("response") ? "response" : "data",
            "document",
            "statusEl",
          ],
          answer: [lesson.codeLines[lesson.codeLines.length - 1].includes("response") ? "response" : lesson.codeLines[0].includes("data") ? "data" : lesson.codeLines[0].includes("statusEl") ? "statusEl" : lesson.codeLines[0].includes("nameInput") ? "nameInput" : "player"],
          previewDefaults: [],
        },
        {
          id: "meaning",
          kind: "tiles",
          prompt: "Choose the value that should appear after this line runs.",
          note: "Match the property to the visible output or returned value.",
          codeLines: lesson.codeLines,
          tiles: lesson.previewLines?.length ? lesson.previewLines : ["Ready", "Saved", "Launch"],
          answer: [lesson.previewLines?.[0] ?? "Ready"],
          previewDefaults: lesson.previewDefaults,
        },
        ...typedStages,
      ];
    case "Set POST Method":
    case "Set Method":
    case "Handle Click":
    case "Listen for Clicks":
    case "Add a Class":
    case "Ensure Success":
    case "Read Content":
    case "Read JSON":
    case "Download Text":
    case "Push a Value":
    case "Add a Name":
    case "Insert an Item":
    case "Set a Score":
    case "Remove First Item":
    case "Remove an Item":
    case "Loop Values":
    case "Loop Names":
    case "Loop Items":
    case "Clear the List":
    case "Read Size":
    case "Read Length":
    case "Read First Item":
    case "Count Items":
    case "Check Contains":
    case "Pop a Value":
      return [
        {
          id: "main",
          kind: "tiles",
          prompt: lesson.prompt,
          note: lesson.note,
          codeLines: lesson.codeLines,
          tiles: lesson.tiles,
          answer: lesson.answer,
          previewDefaults: lesson.previewDefaults,
        },
        {
          id: "receiver",
          kind: "tiles",
          prompt: "Choose the variable or object that this API call should act on.",
          note: "Call the method or read the value from the object that stores the data.",
          codeLines: [lesson.codeLines[0], lesson.codeLines[lesson.codeLines.length - 1].replace("___", lesson.answer[0])],
          tiles: [
            lesson.codeLines[0].includes("names") ? "names" : lesson.codeLines[0].includes("scores") ? "scores" : lesson.codeLines[0].includes("items") ? "items" : lesson.codeLines[0].includes("client") ? "client" : lesson.codeLines[0].includes("response") ? "response" : lesson.codeLines[0].includes("panel") ? "panel" : lesson.codeLines[0].includes("button") ? "button" : lesson.codeLines[0].includes("player") ? "player" : "table",
            "data",
            "value",
          ],
          answer: [
            lesson.codeLines[0].includes("names")
              ? "names"
              : lesson.codeLines[0].includes("scores")
                ? "scores"
                : lesson.codeLines[0].includes("items")
                  ? "items"
                  : lesson.codeLines[0].includes("client")
                    ? "client"
                    : lesson.codeLines[0].includes("response")
                      ? "response"
                      : lesson.codeLines[0].includes("panel")
                        ? "panel"
                        : lesson.codeLines[0].includes("button")
                          ? "button"
                          : lesson.codeLines[0].includes("player")
                            ? "player"
                            : "items",
          ],
          previewDefaults: [],
        },
        {
          id: "result",
          kind: "tiles",
          prompt: "Choose the result you should see after the code runs.",
          note: "Use the API call, then check the output it produces.",
          codeLines: lesson.codeLines,
          tiles: lesson.previewLines?.length ? lesson.previewLines : ["true", "1", "Saved"],
          answer: [lesson.previewLines?.[0] ?? "true"],
          previewDefaults: lesson.previewDefaults,
        },
        ...typedStages,
      ];
    default:
      return null;
  }
}

function buildApiLessonStages(lesson: ApiMiniCourseLesson): ApiMiniCourseStage[] {
  if (lesson.stages && lesson.stages.length > 0) {
    return lesson.stages;
  }
  return (
    buildAuthoredApiStages(lesson) ?? [
      {
        id: "main",
        kind: "tiles",
        prompt: lesson.prompt,
        note: lesson.note,
        codeLines: lesson.codeLines,
        tiles: lesson.tiles,
        answer: lesson.answer,
        previewDefaults: lesson.previewDefaults,
      },
      ...buildTypedStages(lesson),
    ]
  );
}

function drawPreview(kind: string, values: string[], canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f7f3ea";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (kind.startsWith("pygame")) {
    context.fillStyle = "#111827";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(255,255,255,0.08)";
    context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  }

  switch (kind) {
    case "pygame-window": {
      const width = parseNumber(values[0], 640);
      const height = parseNumber(values[1], 360);
      context.fillStyle = "#8bd3ff";
      context.font = "700 28px Inter, sans-serif";
      context.fillText(`${width} x ${height}`, 120, 160);
      break;
    }
    case "pygame-text": {
      const x = parseNumber(values[0], 160);
      const y = parseNumber(values[1], 120);
      context.fillStyle = "#facc15";
      context.font = "800 34px Inter, sans-serif";
      context.textAlign = "center";
      context.fillText("PLAY", x, y);
      context.textAlign = "start";
      break;
    }
    case "pygame-actor": {
      const x = parseNumber(values[0], 200);
      const y = parseNumber(values[1], 160);
      context.fillStyle = "#60a5fa";
      context.fillRect(x - 24, y - 24, 48, 48);
      context.fillStyle = "#f8fafc";
      context.font = "700 16px Inter, sans-serif";
      context.fillText("P", x - 6, y + 6);
      break;
    }
    case "pygame-update": {
      const speed = parseNumber(values[0], 1);
      const x = 120 + speed * 30;
      context.fillStyle = "#34d399";
      context.fillRect(x, 140, 52, 52);
      break;
    }
    case "pygame-background": {
      context.fillStyle = values[0] === "(10, 20, 60)" ? "#0f2b63" : values[0] === "(255, 255, 255)" ? "#ffffff" : "#50c878";
      context.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      break;
    }
    case "pygame-keyboard": {
      const speed = parseNumber(values[0], 0);
      const x = 180 + speed * 18;
      context.fillStyle = "#60a5fa";
      context.fillRect(x, 140, 52, 52);
      break;
    }
    case "pygame-score": {
      const x = parseNumber(values[0], 160);
      const y = parseNumber(values[1], 120);
      context.fillStyle = "#facc15";
      context.font = "800 24px Inter, sans-serif";
      context.fillText("Score: 5", x, y);
      break;
    }
    case "pygame-coin": {
      const x = parseNumber(values[0], 160);
      const y = parseNumber(values[1], 120);
      context.fillStyle = "#fbbf24";
      context.beginPath();
      context.arc(x, y, 18, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "pygame-keys": {
      const x = parseNumber(values[0], 180);
      context.fillStyle = "#60a5fa";
      context.fillRect(x, 140, 52, 52);
      context.fillStyle = "#f8fafc";
      context.font = "700 18px Inter, sans-serif";
      context.fillText("LEFT", 40, 70);
      break;
    }
    case "pygame-gravity": {
      const y = parseNumber(values[0], 90);
      context.fillStyle = "#60a5fa";
      context.fillRect(180, y, 52, 52);
      context.fillStyle = "#94a3b8";
      context.fillRect(20, 240, canvas.width - 40, 10);
      break;
    }
    case "pygame-bounds": {
      const x = parseNumber(values[0], 300);
      context.strokeStyle = "#f8fafc";
      context.strokeRect(40, 60, 280, 150);
      context.fillStyle = "#f97316";
      context.fillRect(Math.min(x, 300), 130, 52, 52);
      break;
    }
    case "pygame-collision": {
      const score = parseNumber(values[0], 0);
      context.fillStyle = "#60a5fa";
      context.fillRect(150, 140, 52, 52);
      context.fillStyle = score > 0 ? "#34d399" : "#fbbf24";
      context.beginPath();
      context.arc(score > 0 ? 175 : 235, 165, 18, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#f8fafc";
      context.font = "700 18px Inter, sans-serif";
      context.fillText(`Score ${score}`, 40, 40);
      break;
    }
    case "pygame-sound": {
      context.fillStyle = "#60a5fa";
      context.fillRect(140, 120, 60, 60);
      context.fillStyle = "#f8fafc";
      context.font = "800 32px Inter, sans-serif";
      context.fillText("♪", 235, 155);
      context.font = "700 18px Inter, sans-serif";
      context.fillText(values[0] === "play" ? "jump sound" : "ready", 40, 40);
      break;
    }
    case "pygame-image": {
      context.fillStyle = values[0] === '"jump"' ? "#f97316" : "#60a5fa";
      context.fillRect(160, 120, 60, 60);
      context.fillStyle = "#f8fafc";
      context.font = "700 16px Inter, sans-serif";
      context.fillText(values[0] === '"jump"' ? "JUMP" : "IDLE", 150, 210);
      break;
    }
    case "pygame-clock": {
      context.fillStyle = "#60a5fa";
      context.fillRect(160, 120, 60, 60);
      context.fillStyle = "#f8fafc";
      context.font = "700 18px Inter, sans-serif";
      context.fillText("reset in 2s", 40, 40);
      context.beginPath();
      context.arc(290, 70, 24, 0, Math.PI * 2);
      context.strokeStyle = "#f8fafc";
      context.lineWidth = 3;
      context.stroke();
      break;
    }
    case "pygame-display": {
      const width = parseNumber(values[0], 800);
      const height = parseNumber(values[1], 450);
      context.fillStyle = "#0f172a";
      context.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      context.strokeStyle = "#f8fafc";
      context.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      context.fillStyle = "#f8fafc";
      context.font = "700 22px Inter, sans-serif";
      context.fillText(`${width} x ${height}`, 120, 160);
      break;
    }
    case "pygame-event": {
      context.fillStyle = "#1e293b";
      context.fillRect(30, 40, canvas.width - 60, 180);
      context.fillStyle = "#f8fafc";
      context.font = "700 16px Inter, sans-serif";
      context.fillText("event queue", 50, 70);
      context.fillStyle = "#ef4444";
      context.fillRect(50, 95, canvas.width - 100, 36);
      context.fillStyle = "#f8fafc";
      context.fillText("QUIT", 70, 118);
      break;
    }
    case "pygame-draw-circle": {
      const x = parseNumber(values[0], 200);
      const y = parseNumber(values[1], 120);
      const radius = parseNumber(values[2], 30);
      context.fillStyle = "#ef4444";
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "pygame-font": {
      context.fillStyle = "#f8fafc";
      context.font = "700 34px Inter, sans-serif";
      context.fillText("Start", 110, 145);
      break;
    }
    case "pygame-image-load": {
      context.fillStyle = "#60a5fa";
      context.fillRect(150, 105, 90, 90);
      context.fillStyle = "#f8fafc";
      context.font = "700 16px Inter, sans-serif";
      context.fillText("player.png", 120, 220);
      break;
    }
    case "pygame-rect": {
      const x = parseNumber(values[0], 400);
      const y = parseNumber(values[1], 225);
      context.strokeStyle = "#f8fafc";
      context.lineWidth = 3;
      context.strokeRect(x - 40, y - 40, 80, 80);
      context.fillStyle = "#60a5fa";
      context.fillRect(x - 20, y - 20, 40, 40);
      break;
    }
    case "pygame-transform": {
      const width = parseNumber(values[0], 64);
      const height = parseNumber(values[1], 64);
      context.fillStyle = "#60a5fa";
      context.fillRect(150, 110, width, height);
      context.fillStyle = "#f8fafc";
      context.font = "700 16px Inter, sans-serif";
      context.fillText(`${width} x ${height}`, 155, 210);
      break;
    }
    case "pygame-mouse": {
      const x = parseNumber(values[0], 240);
      const y = parseNumber(values[1], 150);
      context.strokeStyle = "#f8fafc";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 18, y + 28);
      context.lineTo(x + 8, y + 24);
      context.lineTo(x + 5, y + 38);
      context.closePath();
      context.stroke();
      context.fillStyle = "#f8fafc";
      context.font = "700 16px Inter, sans-serif";
      context.fillText(`(${x}, ${y})`, 40, 40);
      break;
    }
    case "pygame-time": {
      context.strokeStyle = "#f8fafc";
      context.lineWidth = 4;
      context.beginPath();
      context.arc(180, 130, 55, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(180, 130);
      context.lineTo(180, 95);
      context.moveTo(180, 130);
      context.lineTo(215, 130);
      context.stroke();
      context.fillStyle = "#f8fafc";
      context.font = "700 18px Inter, sans-serif";
      context.fillText("60 FPS", 140, 220);
      break;
    }
    case "canvas-rect": {
      const x = parseNumber(values[0], 10);
      const y = parseNumber(values[1], 20);
      context.fillStyle = "#fb7185";
      context.fillRect(x, y, 140, 80);
      break;
    }
    case "canvas-color": {
      context.fillStyle = values[0] || "teal";
      context.fillRect(40, 60, 140, 80);
      break;
    }
    case "canvas-circle": {
      const radius = parseNumber(values[0], 20);
      context.fillStyle = "#1d4ed8";
      context.beginPath();
      context.arc(160, 120, radius, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "canvas-clear": {
      context.fillStyle = "#f97316";
      context.fillRect(20, 20, 180, 120);
      context.clearRect(60, 40, parseNumber(values[0], 20), 40);
      break;
    }
    case "canvas-line": {
      const x = parseNumber(values[0], 120);
      const y = parseNumber(values[1], 80);
      context.strokeStyle = "#4f46e5";
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(40, 40);
      context.lineTo(x, y);
      context.stroke();
      break;
    }
    case "canvas-stroke-color": {
      context.strokeStyle = values[0] || "teal";
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(40, 40);
      context.lineTo(220, 160);
      context.stroke();
      break;
    }
    default:
      break;
  }
}

function renderTextPreview(lesson: ApiMiniCourseLesson, values: string[]) {
  if (lesson.previewLines && lesson.previewLines.length > 0) {
    const previewText = fillApiMiniCourseCode(lesson.previewLines, values, lesson.previewDefaults).join("\n");

    return (
      <pre className="rounded-[1.5rem] border border-gray-100 bg-white p-4 text-sm font-bold text-gray-800 shadow-sm whitespace-pre-wrap">
        {previewText}
      </pre>
    );
  }

  switch (lesson.previewKind) {
    case "random-randint":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 font-mono text-sm font-bold text-gray-800 shadow-sm">
          roll = {Math.floor((parseNumber(values[0], 1) + parseNumber(values[1], 3)) / 2)}
        </div>
      );
    case "random-choice":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 font-mono text-sm font-bold text-gray-800 shadow-sm">
          color = "blue"
        </div>
      );
    case "random-shuffle":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 font-mono text-sm font-bold text-gray-800 shadow-sm">
          cards = [2, 4, 1, 3]
        </div>
      );
    case "random-coin":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 font-mono text-sm font-bold text-gray-800 shadow-sm">
          coin = "heads"
        </div>
      );
    case "fetch-request":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Request</p>
          <p className="mt-3 font-mono text-sm font-bold text-gray-800">GET /api/posts</p>
        </div>
      );
    case "fetch-json":
      return (
        <pre className="rounded-[1.5rem] border border-gray-100 bg-white p-4 text-sm font-bold text-gray-800 shadow-sm">{`{\n  "posts": [\n    { "title": "Launch" }\n  ]\n}`}</pre>
      );
    case "fetch-title":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 font-mono text-sm font-bold text-gray-800 shadow-sm">
          Launch
        </div>
      );
    case "fetch-post":
      return (
        <pre className="rounded-[1.5rem] border border-gray-100 bg-white p-4 text-sm font-bold text-gray-800 shadow-sm">{`{\n  "method": "${values[0] || "GET"}",\n  "status": 201\n}`}</pre>
      );
    default:
      return null;
  }
}

function renderDomPreview(kind: string) {
  switch (kind) {
    case "dom-select":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">#status selected</div>
        </div>
      );
    case "dom-text":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800">Ready</div>
        </div>
      );
    case "dom-click":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
          <button className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-extrabold text-white">Save</button>
          <p className="mt-3 text-sm font-semibold text-gray-500">Click listener attached.</p>
        </div>
      );
    case "dom-class":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">success class added</div>
        </div>
      );
    case "dom-value":
      return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800">Ava</div>
        </div>
      );
    default:
      return null;
  }
}

export default function ApiMiniCourseLessonClient() {
  const params = useParams();
  const router = useRouter();
  const language = params.language as LearningLanguage;
  const courseId = params.course as string;
  const unitId = Number(params.unit as string);
  const lessonId = Number(params.lesson as string);
  const course = useMemo(() => getApiMiniCourse(language, courseId), [courseId, language]);
  const lesson = useMemo(() => getApiMiniCourseLesson(language, courseId, unitId, lessonId), [courseId, language, lessonId, unitId]);
  const stages = useMemo(() => (lesson ? buildApiLessonStages(lesson) : []), [lesson]);
  const allLessons = useMemo(() => getApiMiniCourseLessons(language, courseId), [courseId, language]);
  const currentUnit = course?.units.find((unit) => unit.id === unitId) ?? null;
  const lessonIndex = allLessons.findIndex((item) => item.unitId === unitId && item.lessonId === lessonId);
  const nextLesson = lessonIndex >= 0 ? allLessons[lessonIndex + 1] : null;
  const isChallengeLesson = Boolean(lesson?.isChallenge);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [helperLoading, setHelperLoading] = useState(false);
  const [helperResponse, setHelperResponse] = useState<null | { hint?: string; nextLines?: string[]; why?: string }>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStageIndex(0);
    setSelectedTiles([]);
    setTypedAnswer("");
    setFeedback("idle");
    setWrongAttempts(0);
    setShowAnswer(false);
    setHelperResponse(null);
  }, [lessonId, unitId]);

  useEffect(() => {
    async function load() {
      if (!lesson || !course) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("pico_progress")
        .select("completed_lessons")
        .eq("user_id", user.id)
        .eq("language", language)
        .maybeSingle();

      const parsed = getCompletedApiMiniCourseKeys(parseCompletedLessons(data?.completed_lessons), language, courseId);
      if (!isApiMiniCourseLessonUnlocked(course, parsed, language, unitId, lessonId)) {
        router.push(`/labs/${language}/${courseId}`);
        return;
      }

      setCompletedLessons(parsed);
      setLoading(false);
    }

    load();
  }, [course, courseId, language, lesson, lessonId, router, unitId]);

  const stage = stages[stageIndex] ?? null;
  const blankCount = stage?.kind === "tiles" ? stage.answer.length : 0;
  const previewValues = useMemo(
    () => {
      if (!stage || !lesson) return [];

      if (stage.kind === "tiles") {
        return selectedTiles.map((value) => value).concat(stage.previewDefaults.slice(selectedTiles.length) ?? []);
      }

      if (stage.challengeType === "line") {
        const { blankLineIndex } = buildFilledLineChallenge(lesson);
        if (!typedAnswer.trim() || blankLineIndex < 0) return lesson.previewDefaults;
        return lesson.previewDefaults;
      }

      return lesson.previewDefaults;
    },
    [lesson, selectedTiles, stage, typedAnswer]
  );

  useEffect(() => {
    if (!lesson || lesson.previewMode !== "canvas" || !canvasRef.current) return;
    drawPreview(lesson.previewKind, previewValues, canvasRef.current);
  }, [lesson, previewValues]);

  if (!course || !lesson) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">Mini course lesson not found.</p>
        </div>
      </main>
    );
  }

  const availableTiles = stage?.kind === "tiles" ? stage.tiles.filter((tile, index) => {
    const selectedCount = selectedTiles.filter((item) => item === tile).length;
    const tileCount = stage.tiles.slice(0, index + 1).filter((item) => item === tile).length;
    return selectedCount < tileCount;
  }) : [];
  const filledCodeLines = useMemo(() => {
    if (!lesson || !stage) return [];
    if (stage.kind === "tiles") {
      return fillApiMiniCourseCode(stage.codeLines, selectedTiles, Array(blankCount).fill("___"));
    }

    if (stage.challengeType === "line") {
      const { blankLineIndex } = buildFilledLineChallenge(lesson);
      return stage.codeLines.map((line, index) => {
        if (index !== blankLineIndex) return line;
        return typedAnswer.trim() || line;
      });
    }

    return typedAnswer.trim() ? typedAnswer.split("\n") : stage.codeLines;
  }, [blankCount, lesson, selectedTiles, stage, typedAnswer]);
  const totalStageCount = allLessons.length * 5;
  const progressPercent = (((lessonIndex * 5) + stageIndex + 1) / Math.max(totalStageCount, 1)) * 100;
  const isLastStage = stageIndex === stages.length - 1;
  const teachingSteps = [
    `Read the goal first: ${lesson.prompt}`,
    `Focus on one missing piece at a time. ${lesson.note}`,
    lesson.previewMode === "canvas"
      ? "Watch the preview move as you change the code so you can connect the line to the visual result."
      : lesson.previewMode === "dom"
        ? "Use the preview panel to check what changed in the page before you lock in your answer."
        : "Check the preview output after every tile so you can see what the code is doing.",
  ];

  async function handleCorrect() {
    const key = getApiMiniCourseKey(language, courseId, unitId, lessonId);
    if (completedLessons.includes(key)) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSaving(true);
    const { data } = await supabase
      .from("pico_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("language", language)
      .maybeSingle();

    const parsedLessons = parseCompletedLessons(data?.completed_lessons);
    const mergedLessons = [...new Set([...parsedLessons, key])];

    await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        language,
        values: {
          completed_lessons: JSON.stringify(mergedLessons),
          last_played: new Date().toISOString().split("T")[0],
        },
      }),
    });

    setCompletedLessons((current) => [...new Set([...current, key])]);
    setSaving(false);
  }

  async function checkAnswer() {
    if (!lesson || !stage) return;
    const correct =
      stage.kind === "tiles"
        ? stage.answer.every((value, index) => selectedTiles[index] === value)
        : normalizeTypedCode(typedAnswer) === normalizeTypedCode(stage.expected);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setWrongAttempts(0);
      setShowAnswer(false);
      setHelperResponse(null);
      if (isLastStage) {
        await handleCorrect();
      }
    } else {
      setWrongAttempts((current) => current + 1);
    }
  }

  function getStageAnswerText(currentStage: ApiMiniCourseStage | null) {
    if (!currentStage) return "";
    if (currentStage.kind === "tiles") {
      return currentStage.answer.join(" ");
    }
    return currentStage.expected;
  }

  async function askForHelp() {
    if (!lesson || !stage || helperLoading || !course) return;
    setHelperLoading(true);
    try {
      const response = await fetch("/api/minicourse-help", {
        method: "POST",
        body: JSON.stringify({
          courseTitle: course.title,
          lessonTitle: lesson.title,
          stagePrompt: stage.prompt,
          stageNote: stage.note,
          codeLines: filledCodeLines,
          userAnswer: stage.kind === "tiles" ? selectedTiles : typedAnswer,
          expectedAnswer: stage.kind === "tiles" ? stage.answer : stage.expected,
        }),
      });
      const data = await response.json();
      setHelperResponse(data);
    } finally {
      setHelperLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/labs/${language}/${courseId}`)}
              className="text-sm font-extrabold uppercase tracking-[0.18em] text-gray-400 transition hover:text-gray-600"
            >
              Back
            </button>
            <a href="/learn" className="text-sm font-extrabold uppercase tracking-[0.18em] text-gray-400 transition hover:text-gray-600">
              Exit mini course
            </a>
          </div>
          <div className="flex min-w-[16rem] items-center gap-4">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-sm font-extrabold text-gray-500">{lessonIndex + 1}/{allLessons.length}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <Pico size={100} mood="happy" />
              <div className="min-w-0 flex-1 rounded-[1.75rem] border border-gray-100 bg-white px-6 py-5 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-green-500">Unit {lesson.unitId}</p>
                <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">{lesson.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold leading-7 text-gray-600">{stage?.prompt ?? lesson.prompt}</p>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">
                    Step {stageIndex + 1}/5
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] ${
                    isStartFromZeroChallenge(stage)
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-500"
                  }`}>
                    {getStageLabel(stage)}
                  </span>
                  {isChallengeLesson ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
                      Unit challenge
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {isChallengeLesson || isStartFromZeroChallenge(stage) ? (
              <div className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">
                  {isChallengeLesson ? "Unit challenge" : "Prompt challenge"}
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-amber-900">
                  {isChallengeLesson
                    ? "This lesson is the unit challenge. Build the solution yourself and use the preview to confirm the result."
                    : "Start from zero. Write the full code block yourself so the preview matches the goal."}{" "}
                  If you get stuck, use <span className="font-black">What next?</span> for the next one or two lines and why they work.
                </p>
              </div>
            ) : null}

            {isChallengeLesson ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-5 py-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Your task</p>
                  <div className="mt-4 space-y-3">
                    {(lesson.challengeChecklist ?? []).map((item, index) => (
                      <p key={item} className="text-sm font-semibold leading-6 text-gray-800">
                        {index + 1}. {item}
                      </p>
                    ))}
                    {(lesson.challengeChecklist ?? []).length === 0 ? (
                      <p className="text-sm font-semibold leading-6 text-gray-700">{lesson.note}</p>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-5 py-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Expected output</p>
                  <div className="mt-4 rounded-[1.25rem] border border-gray-100 bg-[#161d2b] px-4 py-4 font-mono text-sm font-bold text-green-400">
                    {lesson.expectedOutput ?? "Match the preview shown on the right."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">What this does</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-gray-700">{currentUnit?.description ?? course.description}</p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">Why it works</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-gray-700">{stage?.note ?? lesson.note}</p>
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">How to solve it</p>
                  <div className="mt-3 space-y-2">
                    {teachingSteps.map((step) => (
                      <p key={step} className="text-sm font-semibold leading-6 text-gray-700">
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-[1.75rem] border border-gray-100 bg-[#161d2b] p-5 text-green-400 shadow-sm">
              {filledCodeLines.map((line, index) => (
                <div key={`${line}-${index}`} className="mb-1 flex gap-3 font-mono text-[15px] leading-7 last:mb-0">
                  <span className="w-5 text-right text-white/40">{index + 1}</span>
                  <span className="whitespace-pre-wrap">{line}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-gray-400">
                {isStartFromZeroChallenge(stage)
                  ? "Challenge editor"
                  : stage?.kind === "typed"
                    ? "Type your code"
                    : "Answer slots"}
              </p>
              {stage?.kind === "tiles" ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {Array.from({ length: blankCount }, (_, index) => {
                    const value = selectedTiles[index];
                    return (
                      <button
                        key={`slot-${index}`}
                        type="button"
                        onClick={() => {
                          if (!value) return;
                          setSelectedTiles((current) => current.filter((_, tileIndex) => tileIndex !== index));
                          setFeedback("idle");
                        }}
                        className={`min-w-[6rem] rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-sm transition ${
                          value ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-300"
                        }`}
                      >
                        {value || "Select"}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={typedAnswer}
                  onChange={(event) => {
                    setTypedAnswer(event.target.value);
                    setFeedback("idle");
                  }}
                  placeholder={getTypedStagePlaceholder(stage)}
                  className="mt-3 h-36 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm font-bold text-gray-800 shadow-sm outline-none transition focus:border-green-300 focus:ring-2 focus:ring-green-100"
                />
              )}
            </div>

            {stage?.kind === "tiles" ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {availableTiles.map((tile, index) => (
                  <button
                    key={`${tile}-${index}`}
                    type="button"
                    onClick={() => {
                      if (selectedTiles.length >= blankCount) return;
                      setSelectedTiles((current) => [...current, tile]);
                      setFeedback("idle");
                      setShowAnswer(false);
                      setHelperResponse(null);
                    }}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300"
                  >
                    {tile}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  feedback === "correct" && !isLastStage
                    ? false
                    : stage?.kind === "tiles"
                      ? selectedTiles.length !== blankCount || saving || loading
                      : !typedAnswer.trim() || saving || loading
                }
                onClick={() => {
                  if (feedback === "correct" && !isLastStage) {
                    setStageIndex((current) => current + 1);
                    setSelectedTiles([]);
                    setTypedAnswer("");
                    setFeedback("idle");
                    setWrongAttempts(0);
                    setShowAnswer(false);
                    return;
                  }

                  void checkAnswer();
                }}
                className="rounded-[1.4rem] bg-green-500 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-200"
              >
                {feedback === "correct" && !isLastStage
                  ? "Next step"
                  : saving
                    ? "Saving..."
                    : isStartFromZeroChallenge(stage)
                      ? "Check challenge"
                      : "Check"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTiles([]);
                  setTypedAnswer("");
                  setFeedback("idle");
                  setShowAnswer(false);
                  setHelperResponse(null);
                }}
                className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Reset
              </button>
              {isStartFromZeroChallenge(stage) ? (
                <button
                  type="button"
                  onClick={() => void askForHelp()}
                  disabled={helperLoading || loading || saving}
                  className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  {helperLoading ? "Loading help..." : "What next?"}
                </button>
              ) : null}
              {feedback === "correct" && isLastStage ? (
                <a href={`/labs/${language}/${courseId}`} className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50">
                  Finish lesson
                </a>
              ) : null}
              {feedback === "correct" && isLastStage && nextLesson ? (
                <a href={`/labs/${language}/${courseId}/${nextLesson.unitId}/${nextLesson.lessonId}`} className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-gray-700 shadow-sm transition hover:bg-gray-50">
                  Next
                </a>
              ) : null}
            </div>

            <div className={`mt-5 rounded-[1.5rem] border px-4 py-4 text-sm font-bold ${
              feedback === "correct"
                ? "border-green-200 bg-green-50 text-green-700"
                : feedback === "wrong"
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-gray-100 bg-gray-50 text-gray-500"
            }`}>
              {feedback === "correct"
                ? isLastStage
                  ? "Correct. The preview now matches the target output."
                  : "Correct. Open the next step to keep building the idea."
                : feedback === "wrong"
                  ? `Hint: ${stage?.note ?? lesson.note}`
                  : stage?.note ?? lesson.note}
              {feedback === "wrong" ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {wrongAttempts >= 2 ? (
                    <button
                      type="button"
                      onClick={() => setShowAnswer((current) => !current)}
                      className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-red-600 transition hover:bg-red-50"
                    >
                      {showAnswer ? "Hide answer" : "Show answer"}
                    </button>
                  ) : null}
                  {showAnswer ? (
                    <code className="rounded-xl bg-white px-3 py-2 font-mono text-xs font-bold text-red-700 whitespace-pre-wrap">
                      {getStageAnswerText(stage)}
                    </code>
                  ) : null}
                </div>
              ) : null}
            </div>

            {helperResponse && isStartFromZeroChallenge(stage) ? (
              <div className="mt-5 rounded-[1.5rem] border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-bold text-blue-800">
                {helperResponse.hint ? <p>Hint: {helperResponse.hint}</p> : null}
                {helperResponse.nextLines?.length ? (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-500">Next lines</p>
                    <pre className="rounded-xl bg-white px-3 py-3 font-mono text-xs font-bold text-blue-900 whitespace-pre-wrap">
                      {helperResponse.nextLines.join("\n")}
                    </pre>
                  </div>
                ) : null}
                {helperResponse.why ? <p className="mt-3 leading-6">{helperResponse.why}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-gray-100 bg-[#161d2b] p-5 text-white shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-300">Preview</p>
                  <h2 className="mt-3 text-3xl font-black">
                    {lesson.previewMode === "canvas" ? "Live canvas" : lesson.previewMode === "dom" ? "Live DOM" : "Live output"}
                  </h2>
                </div>
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#0f1520] p-3">
                {lesson.previewMode === "canvas" ? (
                  <canvas ref={canvasRef} width={480} height={320} className="h-auto w-full rounded-[1rem] border border-white/10 bg-[#f7f3ea]" />
                ) : lesson.previewMode === "dom" ? (
                  renderDomPreview(lesson.previewKind)
                ) : (
                  renderTextPreview(lesson, previewValues)
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
