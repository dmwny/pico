"use client";

import type { LessonCodeRunResult } from "@/lib/lessonArc/types";

type PyodideApi = {
  runPythonAsync: (code: string) => Promise<string>;
};

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideApi>;
  }
}

const PYODIDE_VERSION = "0.27.5";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

let pyodidePromise: Promise<PyodideApi> | null = null;

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Pyodide is only available in the browser."));
      return;
    }

    if (window.loadPyodide) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-pico-pyodide="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Pyodide failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.dataset.picoPyodide = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Pyodide failed to load."));
    document.head.appendChild(script);
  });
}

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript();
      if (!window.loadPyodide) {
        throw new Error("Pyodide loader was not available.");
      }
      return window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    })();
  }

  return pyodidePromise;
}

export async function runPythonAgainstTests(code: string, testCases: Array<{ input: string; expected: string }>) {
  try {
    const pyodide = await getPyodide();
    const codeJson = JSON.stringify(code);
    const testsJson = JSON.stringify(testCases);
    const response = await pyodide.runPythonAsync(`
import json
import traceback

student_code = json.loads(${JSON.stringify(codeJson)})
test_cases = json.loads(${JSON.stringify(testsJson)})
results = []
error_message = ""

namespace = {}

try:
    exec(student_code, namespace, namespace)
    for case in test_cases:
        try:
            actual = repr(eval(case["input"], namespace, namespace))
            results.append({
                "input": case["input"],
                "expected": case["expected"],
                "actual": actual,
                "passed": actual == case["expected"],
            })
        except Exception as case_error:
            results.append({
                "input": case["input"],
                "expected": case["expected"],
                "actual": f"ERROR: {case_error}",
                "passed": False,
            })
except Exception:
    error_message = traceback.format_exc()

json.dumps({
    "ok": error_message == "",
    "passed": error_message == "" and all(item["passed"] for item in results),
    "output": "",
    "tests": results,
    "error": error_message,
})
`);

    return JSON.parse(response) as LessonCodeRunResult;
  } catch (error) {
    return {
      ok: false,
      passed: false,
      output: "",
      tests: testCases.map((testCase) => ({
        input: testCase.input,
        expected: testCase.expected,
        actual: "runtime unavailable",
        passed: false,
      })),
      error: error instanceof Error ? error.message : "Python runtime unavailable.",
    } satisfies LessonCodeRunResult;
  }
}
