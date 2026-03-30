export type TurtleState = {
  x: number;
  y: number;
  heading: number;
  penDown: boolean;
  color: string;
  lineWidth: number;
  background: string;
};

export type TurtleRunResult = {
  commands: number;
  output: string[];
  error: string | null;
};

type TurtleValue = number | string | null | TurtleValue[];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function splitArgs(source: string) {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let quote: "'" | '"' | null = null;

  for (const character of source) {
    if ((character === "'" || character === '"') && (!quote || quote === character)) {
      quote = quote ? null : character;
      current += character;
      continue;
    }

    if (!quote) {
      if (character === "(") depth += 1;
      if (character === ")") depth -= 1;

      if (character === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }
    }

    current += character;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function evaluateValue(raw: string, variables: Record<string, unknown>): TurtleValue | unknown {
  const source = raw.trim();

  if (!source) return null;

  if ((source.startsWith('"') && source.endsWith('"')) || (source.startsWith("'") && source.endsWith("'"))) {
    return source.slice(1, -1);
  }

  if (source.startsWith("(") && source.endsWith(")")) {
    const inner = source.slice(1, -1);
    return splitArgs(inner).map((part) => evaluateValue(part, variables));
  }

  if (source in variables) {
    return variables[source];
  }

  if (/^[\d+\-*/ ()._a-zA-Z]+$/.test(source)) {
    const expression = source.replace(/[A-Za-z_]\w*/g, (token) => {
      const value = variables[token];
      return typeof value === "number" ? String(value) : token;
    });

    if (/^[\d+\-*/ ().]+$/.test(expression)) {
      try {
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${expression});`)();
      } catch {
        return source;
      }
    }
  }

  return source;
}

function drawLine(context: CanvasRenderingContext2D, state: TurtleState, nextX: number, nextY: number) {
  if (!state.penDown) {
    state.x = nextX;
    state.y = nextY;
    return;
  }

  context.beginPath();
  context.moveTo(state.x, state.y);
  context.lineTo(nextX, nextY);
  context.strokeStyle = state.color;
  context.lineWidth = state.lineWidth;
  context.lineCap = "round";
  context.stroke();

  state.x = nextX;
  state.y = nextY;
}

function moveForward(context: CanvasRenderingContext2D, state: TurtleState, distance: number) {
  const radians = (state.heading * Math.PI) / 180;
  const nextX = state.x + Math.cos(radians) * distance;
  const nextY = state.y - Math.sin(radians) * distance;
  drawLine(context, state, nextX, nextY);
}

function drawCircle(context: CanvasRenderingContext2D, state: TurtleState, radius: number) {
  const safeRadius = Math.abs(radius);
  const centerX = state.x;
  const centerY = state.y + radius;

  if (state.penDown) {
    context.beginPath();
    context.arc(centerX, centerY, safeRadius, 0, Math.PI * 2);
    context.strokeStyle = state.color;
    context.lineWidth = state.lineWidth;
    context.stroke();
  }
}

function runBlock(
  lines: string[],
  startIndex: number,
  indent: number,
  context: CanvasRenderingContext2D,
  state: TurtleState,
  variables: Record<string, unknown>,
  turtleName: { current: string },
  output: string[]
): { nextIndex: number; commands: number; error: string | null } {
  let index = startIndex;
  let commands = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const currentIndent = rawLine.match(/^\s*/)?.[0].length ?? 0;

    if (currentIndent < indent) {
      break;
    }

    if (currentIndent > indent) {
      return {
        nextIndex: index + 1,
        commands,
        error: `Check indentation near line ${index + 1}.`,
      };
    }

    if (/^for\s+\w+\s+in\s+range\(/.test(trimmed)) {
      const loopMatch = trimmed.match(/^for\s+(\w+)\s+in\s+range\((.+)\):$/);
      if (!loopMatch) {
        return { nextIndex: index + 1, commands, error: `Loop syntax error on line ${index + 1}.` };
      }

      const [, loopName, loopArgsRaw] = loopMatch;
      const loopArgs = splitArgs(loopArgsRaw).map((part) => Number(evaluateValue(part, variables)));
      const [firstArg, secondArg] = loopArgs;
      const start = loopArgs.length === 1 ? 0 : firstArg;
      const stop = loopArgs.length === 1 ? firstArg : secondArg;

      if (!Number.isFinite(start) || !Number.isFinite(stop)) {
        return { nextIndex: index + 1, commands, error: `Loop range must use numbers on line ${index + 1}.` };
      }

      const blockStart = index + 1;
      let blockEnd = blockStart;

      while (blockEnd < lines.length) {
        const candidate = lines[blockEnd];
        const candidateTrimmed = candidate.trim();
        const candidateIndent = candidate.match(/^\s*/)?.[0].length ?? 0;
        if (candidateTrimmed && candidateIndent <= indent) {
          break;
        }
        blockEnd += 1;
      }

      for (let loopIndex = start; loopIndex < stop; loopIndex += 1) {
        variables[loopName] = loopIndex;
        const nestedResult = runBlock(lines, blockStart, indent + 4, context, state, variables, turtleName, output);
        if (nestedResult.error) return nestedResult;
        commands += nestedResult.commands;
      }

      index = blockEnd;
      continue;
    }

    if (
      trimmed === "import turtle" ||
      trimmed === "from turtle import *" ||
      trimmed.endsWith("= turtle.Screen()") ||
      trimmed.endsWith(".speed(0)") ||
      trimmed.endsWith(".speed(\"fastest\")")
    ) {
      index += 1;
      continue;
    }

    const assignmentMatch = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const [, name, valueRaw] = assignmentMatch;

      if (/^turtle\.Turtle\(\)$/.test(valueRaw.trim())) {
        turtleName.current = name;
        variables[name] = "__turtle__";
        index += 1;
        continue;
      }

      variables[name] = evaluateValue(valueRaw, variables);
      index += 1;
      continue;
    }

    const commandMatch = trimmed.match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\((.*)\)$/);
    if (!commandMatch) {
      return { nextIndex: index + 1, commands, error: `Unsupported command on line ${index + 1}: ${trimmed}` };
    }

    const [, rawReceiver, argsRaw] = commandMatch;
    const args = splitArgs(argsRaw).map((part) => evaluateValue(part, variables));
    const method = rawReceiver.includes(".") ? rawReceiver.split(".").pop() ?? rawReceiver : rawReceiver;
    const target = rawReceiver.includes(".") ? rawReceiver.split(".")[0] : turtleName.current;
    const isTurtleTarget = target === turtleName.current || target === "turtle";

    if (rawReceiver === "print") {
      output.push(args.map((value) => String(value)).join(" "));
      commands += 1;
      index += 1;
      continue;
    }

    if (!isTurtleTarget) {
      return { nextIndex: index + 1, commands, error: `Only turtle commands are supported right now. Check line ${index + 1}.` };
    }

    if (method === "forward") {
      moveForward(context, state, Number(args[0] ?? 0));
    } else if (method === "backward") {
      moveForward(context, state, Number(args[0] ?? 0) * -1);
    } else if (method === "left") {
      state.heading += Number(args[0] ?? 0);
    } else if (method === "right") {
      state.heading -= Number(args[0] ?? 0);
    } else if (method === "penup") {
      state.penDown = false;
    } else if (method === "pendown") {
      state.penDown = true;
    } else if (method === "goto") {
      const [xValue, yValue] = Array.isArray(args[0]) && args.length === 1 ? (args[0] as unknown[]) : args;
      drawLine(context, state, Number(xValue ?? state.x), Number(yValue ?? state.y));
    } else if (method === "color") {
      state.color = String(args[0] ?? state.color);
    } else if (method === "pensize" || method === "width") {
      state.lineWidth = clamp(Number(args[0] ?? state.lineWidth), 1, 20);
    } else if (method === "setheading") {
      state.heading = Number(args[0] ?? state.heading);
    } else if (method === "home") {
      drawLine(context, state, 240, 240);
      state.heading = 0;
    } else if (method === "circle") {
      drawCircle(context, state, Number(args[0] ?? 0));
    } else if (method === "dot") {
      context.beginPath();
      context.arc(state.x, state.y, Number(args[0] ?? 8) / 2, 0, Math.PI * 2);
      context.fillStyle = state.color;
      context.fill();
    } else if (method === "bgcolor") {
      state.background = String(args[0] ?? state.background);
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = state.background;
      context.fillRect(0, 0, 480, 480);
      context.restore();
    } else if (method === "clear" || method === "reset") {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = state.background;
      context.fillRect(0, 0, 480, 480);
      context.restore();
      state.x = 240;
      state.y = 240;
      state.heading = 0;
    } else if (method === "hideturtle" || method === "showturtle" || method === "speed" || method === "shape") {
      // Accepted in the preview.
    } else {
      return { nextIndex: index + 1, commands, error: `Command "${method}" is not supported yet.` };
    }

    commands += 1;
    index += 1;
  }

  return { nextIndex: index, commands, error: null };
}

export function runTurtleProgram(code: string, canvas: HTMLCanvasElement): TurtleRunResult {
  const context = canvas.getContext("2d");
  if (!context) {
    return { commands: 0, output: [], error: "Canvas could not start." };
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f7f3ea";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(44,62,80,0.08)";
  context.lineWidth = 1;

  for (let grid = 40; grid < canvas.width; grid += 40) {
    context.beginPath();
    context.moveTo(grid, 0);
    context.lineTo(grid, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, grid);
    context.lineTo(canvas.width, grid);
    context.stroke();
  }

  context.strokeStyle = "rgba(44,62,80,0.14)";
  context.beginPath();
  context.moveTo(canvas.width / 2, 0);
  context.lineTo(canvas.width / 2, canvas.height);
  context.stroke();
  context.beginPath();
  context.moveTo(0, canvas.height / 2);
  context.lineTo(canvas.width, canvas.height / 2);
  context.stroke();

  const turtleState: TurtleState = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    heading: 0,
    penDown: true,
    color: "#2c7a7b",
    lineWidth: 3,
    background: "#f7f3ea",
  };

  const variables: Record<string, unknown> = {};
  const turtleName = { current: "turtle" };
  const output: string[] = [];
  const lines = code.replace(/\t/g, "    ").split("\n");
  const result = runBlock(lines, 0, 0, context, turtleState, variables, turtleName, output);

  context.beginPath();
  context.arc(turtleState.x, turtleState.y, 7, 0, Math.PI * 2);
  context.fillStyle = "#1d2730";
  context.fill();

  return {
    commands: result.commands,
    output,
    error: result.error,
  };
}
