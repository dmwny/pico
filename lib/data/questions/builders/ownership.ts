import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

export function buildOwnershipQuestions(concept: string): Question[] {
  const q = createQuestionFactory("rust", concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does ownership mean in Rust?",
    options: [
      "Each value has an owner that controls its lifetime",
      "Every variable is global",
      "All values are copied automatically",
      "Functions cannot use strings",
    ],
    correctIndex: 0,
    explanation: "Ownership is Rust's rule system for who owns a value and when it gets cleaned up.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does `&name` create in Rust?",
    options: [
      "A borrow of `name`",
      "A loop over `name`",
      "A string method",
      "A new owned copy",
    ],
    correctIndex: 0,
    explanation: "`&name` borrows the value so code can use it without taking ownership away.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Why is `.clone()` useful?",
    options: [
      "It makes a separate owned copy",
      "It converts text to a number",
      "It starts a loop",
      "It removes all borrowing rules",
    ],
    correctIndex: 0,
    explanation: "`.clone()` creates another owned value so both variables can be used independently.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "Borrowing with `&` lets you use a value without taking ownership of it.",
    correct: true,
    explanation: "A borrow references the value while leaving ownership with the original variable.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `Ada`.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n    println!(\"{}\", alias);\n}",
    correct: true,
    explanation: "The borrowed reference `alias` points to the same string data, so printing it shows Ada.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n    println!(\"{}\", alias);\n}",
    options: ["Ada", "name", "&name", "error"],
    correctIndex: 0,
    correctAnswer: "Ada",
    explanation: "Borrowing lets the code read the same string value through `alias`.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let copy = name.clone();\n    println!(\"{} {}\", name, copy);\n}",
    options: ["Ada Ada", "Ada", "copy", "error"],
    correctIndex: 0,
    correctAnswer: "Ada Ada",
    explanation: "Because `.clone()` makes a separate owned copy, both `name` and `copy` can be printed.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the symbol used to borrow a value.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n} // borrow symbol: _____",
    correctAnswer: "&",
    explanation: "Rust uses `&` to create a borrow of a value.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the method that makes an owned copy.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let copy = name.clone();\n} // copy-making method: _____",
    correctAnswer: "clone",
    explanation: "The method used to create an owned copy is `clone`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the line that borrows `name` into `alias`.",
    tokens: ["let", "alias", "=", "&", "name", ";", "clone", "mut"],
    correctTokens: ["let", "alias", "=", "&", "name", ";"],
    correctAnswer: "let alias = & name ;",
    explanation: "This line borrows the value in `name` instead of moving ownership.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each ownership pattern to its meaning.",
    pairs: [
      { left: "&name", right: "borrow the value" },
      { left: "name.clone()", right: "make an owned copy" },
      { left: "let name = String::from(\"Ada\");", right: "create an owned string" },
      { left: "println!(\"{}\", alias);", right: "use a borrowed reference" },
    ],
    explanation: "These patterns cover owning a value, borrowing it, cloning it, and reading it through a reference.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why might you borrow a value instead of cloning it?",
    options: [
      "To use it without creating a new owned copy",
      "To turn it into a loop",
      "To convert it to a number",
      "To avoid all ownership rules",
    ],
    correctIndex: 0,
    explanation: "Borrowing lets you use the value while keeping the original owner, which can avoid an unnecessary copy.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why might you choose `.clone()` instead of borrowing?",
    options: [
      "You need another owned value that can live separately",
      "You want to remove all type annotations",
      "You want to stop using strings",
      "You need to create a comment",
    ],
    correctIndex: 0,
    explanation: "Cloning is useful when you truly need another owned copy rather than a temporary borrow.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "Borrowing keeps ownership with the original variable.",
    correct: true,
    explanation: "The owner stays the same after a borrow. The reference only gives temporary access.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code uses both the original string and its clone.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let copy = name.clone();\n    println!(\"{} {}\", name, copy);\n}",
    correct: true,
    explanation: "Because `copy` is a clone, printing both values is valid.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n    println!(\"{} {}\", name, alias);\n}",
    options: ["Ada Ada", "Ada", "alias", "error"],
    correctIndex: 0,
    correctAnswer: "Ada Ada",
    explanation: "The original string and the borrowed reference both refer to the same underlying text, so both print Ada.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "fn main() {\n    let name = String::from(\"Pico\");\n    let copy = name.clone();\n    println!(\"{}\", copy);\n}",
    options: ["Pico", "name", "copy", "error"],
    correctIndex: 0,
    correctAnswer: "Pico",
    explanation: "The cloned value holds the same text as the original string, so printing it shows Pico.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable that holds the borrowed reference.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n} // borrowed variable: _____",
    correctAnswer: "alias",
    explanation: "The borrowed reference is stored in the variable `alias`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the method that creates the owned copy.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let copy = name.clone();\n} // copy method: _____",
    correctAnswer: "clone",
    explanation: "`clone` is the method used to create another owned value.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the line that clones `name` into `copy`.",
    tokens: ["let", "copy", "=", "name", ".", "clone", "(", ")", ";", "&"],
    correctTokens: ["let", "copy", "=", "name", ".", "clone", "(", ")", ";"],
    correctAnswer: "let copy = name . clone ( ) ;",
    explanation: "This line creates a new owned string called `copy`.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each ownership token to its role.",
    pairs: [
      { left: "&", right: "borrow operator" },
      { left: "clone()", right: "owned copy method" },
      { left: "alias", right: "borrowed reference variable" },
      { left: "copy", right: "cloned owner variable" },
    ],
    explanation: "These patterns distinguish borrowing syntax from cloning syntax and the variables that use them.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the method that makes an owned copy.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let copy = name.clone();\n} // copy method: _____",
    options: ["clone", "borrow", "len", "push"],
    correctIndex: 0,
    correctAnswer: "clone",
    explanation: "`clone` is the method that creates another owned value instead of just borrowing.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the main difference between borrowing and cloning?",
    options: [
      "Borrowing shares access, while cloning makes another owned value",
      "Borrowing creates a new string, while cloning removes ownership",
      "Borrowing only works with numbers, while cloning only works with text",
      "There is no difference",
    ],
    correctIndex: 0,
    explanation: "Borrowing gives access to the same value, while cloning creates a second owned copy.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why does Rust make ownership explicit?",
    options: [
      "To keep memory use safe and predictable",
      "To remove the need for functions",
      "To make every value global",
      "To avoid using variables",
    ],
    correctIndex: 0,
    explanation: "Ownership is one of Rust's core safety systems. It helps the language manage memory without a garbage collector.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "Borrowing lets multiple names read the same value without creating another owner.",
    correct: true,
    explanation: "A borrow references the original value instead of taking or duplicating ownership.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays `Pico Pico`.",
    code: "fn main() {\n    let name = String::from(\"Pico\");\n    let copy = name.clone();\n    println!(\"{} {}\", name, copy);\n}",
    correct: true,
    explanation: "The clone creates a second owned string with the same contents, so both print Pico.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "fn main() {\n    let name = String::from(\"Pico\");\n    let copy = name.clone();\n    println!(\"{} {}\", name, copy);\n}",
    options: ["Pico Pico", "Pico", "copy", "error"],
    correctIndex: 0,
    correctAnswer: "Pico Pico",
    explanation: "The original value and the clone both contain the same text, so the line prints Pico twice.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n    println!(\"{}\", alias);\n}",
    options: ["Ada", "name", "&name", "error"],
    correctIndex: 0,
    correctAnswer: "Ada",
    explanation: "The borrowed reference points to the same underlying string, so printing it shows Ada.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the symbol used to borrow a value.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n} // borrow symbol: _____",
    correctAnswer: "&",
    explanation: "The `&` symbol creates a borrow in Rust.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the method used to make a second owner.",
    code: "fn main() {\n    let name = String::from(\"Pico\");\n    let copy = name.clone();\n} // second-owner method: _____",
    correctAnswer: "clone",
    explanation: "The `clone` method makes another owned value rather than a borrowed reference.",
  });
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the line that borrows `name` into `alias`.",
    tokens: ["let", "alias", "=", "&", "name", ";", "clone", "."],
    correctTokens: ["let", "alias", "=", "&", "name", ";"],
    correctAnswer: "let alias = & name ;",
    explanation: "This line borrows `name` without taking ownership away from the original variable.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each ownership pattern to its effect.",
    pairs: [
      { left: "&name", right: "read without taking ownership" },
      { left: "name.clone()", right: "make a separate owner" },
      { left: "let alias = &name;", right: "store a borrowed reference" },
      { left: "let copy = name.clone();", right: "store an owned copy" },
    ],
    explanation: "These patterns separate borrowing from cloning and show what each line accomplishes.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the symbol used to borrow a value.",
    code: "fn main() {\n    let name = String::from(\"Ada\");\n    let alias = &name;\n} // borrow symbol: _____",
    options: ["&", "*", "@", "#"],
    correctIndex: 0,
    correctAnswer: "&",
    explanation: "Rust uses `&` to borrow a value while leaving ownership with the original variable.",
  });

  return ensureQuestionCount(q.done(), "rust", concept);
}
