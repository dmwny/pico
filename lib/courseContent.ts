export type LearningLanguage = "python" | "javascript";

export interface LessonMeta {
  id: number;
  title: string;
}

export interface UnitMeta {
  id: number;
  title: string;
  description: string;
  lessons: LessonMeta[];
}

export interface SectionMeta {
  id: number;
  title: string;
  level: string;
  color: string;
  borderColor: string;
  bgTheme: string;
  textAccent: string;
  hex: string;
  picoMessage: string;
  units: UnitMeta[];
}

export interface UnitChallenge {
  title: string;
  description: string;
  prompt: string;
  exampleOutput: string;
}

export interface MiniCourseMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: "live" | "coming_soon" | "planned";
  badge: string;
  href?: string;
}

const BASE_SECTION_META = [
  {
    id: 1,
    title: "Getting Started",
    level: "Section 1",
    color: "bg-green-500",
    borderColor: "border-green-600",
    bgTheme: "bg-green-50",
    textAccent: "text-green-500",
    hex: "#22c55e",
    picoMessage: "Let's write your first line of code!",
  },
  {
    id: 2,
    title: "Speed Training",
    level: "Section 2",
    color: "bg-blue-500",
    borderColor: "border-blue-600",
    bgTheme: "bg-blue-50",
    textAccent: "text-blue-500",
    hex: "#3b82f6",
    picoMessage: "Getting faster! Keep that streak going!",
  },
  {
    id: 3,
    title: "Pro Challenges",
    level: "Section 3",
    color: "bg-purple-500",
    borderColor: "border-purple-600",
    bgTheme: "bg-purple-50",
    textAccent: "text-purple-500",
    hex: "#a855f7",
    picoMessage: "This one's tricky. You've got this!",
  },
] as const;

const PYTHON_SECTIONS: SectionMeta[] = [
  {
    ...BASE_SECTION_META[0],
    units: [
      { id: 1, title: "Hello World", description: "Your first lines of code", lessons: [{ id: 1, title: "Your first print()" }, { id: 2, title: "Printing numbers" }, { id: 3, title: "Printing multiple things" }, { id: 4, title: "Comments" }, { id: 5, title: "Unit challenge" }] },
      { id: 2, title: "Variables", description: "Store and use information", lessons: [{ id: 1, title: "Creating a variable" }, { id: 2, title: "Variable names" }, { id: 3, title: "Changing a variable" }, { id: 4, title: "Printing variables" }, { id: 5, title: "Unit challenge" }] },
      { id: 3, title: "User Input", description: "Let users interact with your code", lessons: [{ id: 1, title: "The input() function" }, { id: 2, title: "Storing input" }, { id: 3, title: "Input with numbers" }, { id: 4, title: "Using input in print" }, { id: 5, title: "Unit challenge" }] },
      { id: 4, title: "Strings", description: "Work with text in Python", lessons: [{ id: 1, title: "Joining strings" }, { id: 2, title: "String length" }, { id: 3, title: "Upper and lower case" }, { id: 4, title: "f-strings" }, { id: 5, title: "Unit challenge" }] },
    ],
  },
  {
    ...BASE_SECTION_META[1],
    units: [
      { id: 5, title: "Conditions", description: "Make decisions in your code", lessons: [{ id: 1, title: "if statements" }, { id: 2, title: "else statements" }, { id: 3, title: "elif statements" }, { id: 4, title: "Combining conditions" }, { id: 5, title: "Unit challenge" }] },
      { id: 6, title: "Loops", description: "Repeat code automatically", lessons: [{ id: 1, title: "while loops" }, { id: 2, title: "for loops" }, { id: 3, title: "range()" }, { id: 4, title: "break and continue" }, { id: 5, title: "Unit challenge" }] },
      { id: 7, title: "Functions", description: "Write reusable blocks of code", lessons: [{ id: 1, title: "Defining a function" }, { id: 2, title: "Calling a function" }, { id: 3, title: "Parameters" }, { id: 4, title: "Return values" }, { id: 5, title: "Unit challenge" }] },
      { id: 8, title: "Lists", description: "Store multiple values together", lessons: [{ id: 1, title: "Creating a list" }, { id: 2, title: "Accessing items" }, { id: 3, title: "Adding and removing" }, { id: 4, title: "Looping through lists" }, { id: 5, title: "Unit challenge" }] },
    ],
  },
  {
    ...BASE_SECTION_META[2],
    units: [
      { id: 9, title: "Dictionaries", description: "Store data with keys and values", lessons: [{ id: 1, title: "Creating a dictionary" }, { id: 2, title: "Accessing values" }, { id: 3, title: "Adding and updating" }, { id: 4, title: "Looping through dicts" }, { id: 5, title: "Unit challenge" }] },
      { id: 10, title: "File Handling", description: "Read and write files", lessons: [{ id: 1, title: "Opening files" }, { id: 2, title: "Reading files" }, { id: 3, title: "Writing files" }, { id: 4, title: "Closing files" }, { id: 5, title: "Unit challenge" }] },
      { id: 11, title: "Classes", description: "Build your own data types", lessons: [{ id: 1, title: "Defining a class" }, { id: 2, title: "The __init__ method" }, { id: 3, title: "Attributes" }, { id: 4, title: "Methods" }, { id: 5, title: "Unit challenge" }] },
      { id: 12, title: "Final Project", description: "Build a real Python program", lessons: [{ id: 1, title: "Planning your project" }, { id: 2, title: "Building the structure" }, { id: 3, title: "Adding features" }, { id: 4, title: "Testing and fixing" }, { id: 5, title: "Final challenge" }] },
    ],
  },
];

const JAVASCRIPT_SECTIONS: SectionMeta[] = [
  {
    ...BASE_SECTION_META[0],
    units: [
      { id: 1, title: "Hello Console", description: "Your first JavaScript lines", lessons: [{ id: 1, title: "Your first console.log()" }, { id: 2, title: "Logging numbers" }, { id: 3, title: "Logging multiple values" }, { id: 4, title: "Comments" }, { id: 5, title: "Unit challenge" }] },
      { id: 2, title: "Variables", description: "Store and update values", lessons: [{ id: 1, title: "Creating a variable" }, { id: 2, title: "let vs const" }, { id: 3, title: "Changing a variable" }, { id: 4, title: "Logging variables" }, { id: 5, title: "Unit challenge" }] },
      { id: 3, title: "User Input", description: "Let users interact with your code", lessons: [{ id: 1, title: "The prompt() function" }, { id: 2, title: "Storing input" }, { id: 3, title: "Turning text into numbers" }, { id: 4, title: "Using input in console.log" }, { id: 5, title: "Unit challenge" }] },
      { id: 4, title: "Strings", description: "Work with text in JavaScript", lessons: [{ id: 1, title: "Joining strings" }, { id: 2, title: "String length" }, { id: 3, title: "Uppercase and lowercase" }, { id: 4, title: "Template literals" }, { id: 5, title: "Unit challenge" }] },
    ],
  },
  {
    ...BASE_SECTION_META[1],
    units: [
      { id: 5, title: "Conditions", description: "Make decisions in your code", lessons: [{ id: 1, title: "if statements" }, { id: 2, title: "else statements" }, { id: 3, title: "else if statements" }, { id: 4, title: "Combining conditions" }, { id: 5, title: "Unit challenge" }] },
      { id: 6, title: "Loops", description: "Repeat code automatically", lessons: [{ id: 1, title: "while loops" }, { id: 2, title: "for loops" }, { id: 3, title: "Loop counters" }, { id: 4, title: "break and continue" }, { id: 5, title: "Unit challenge" }] },
      { id: 7, title: "Functions", description: "Write reusable blocks of code", lessons: [{ id: 1, title: "Defining a function" }, { id: 2, title: "Calling a function" }, { id: 3, title: "Parameters" }, { id: 4, title: "Return values" }, { id: 5, title: "Unit challenge" }] },
      { id: 8, title: "Arrays", description: "Store multiple values together", lessons: [{ id: 1, title: "Creating an array" }, { id: 2, title: "Accessing items" }, { id: 3, title: "Adding and removing" }, { id: 4, title: "Looping through arrays" }, { id: 5, title: "Unit challenge" }] },
    ],
  },
  {
    ...BASE_SECTION_META[2],
    units: [
      { id: 9, title: "Objects", description: "Store data with keys and values", lessons: [{ id: 1, title: "Creating an object" }, { id: 2, title: "Accessing values" }, { id: 3, title: "Adding and updating" }, { id: 4, title: "Looping through objects" }, { id: 5, title: "Unit challenge" }] },
      { id: 10, title: "The DOM", description: "Read and update a web page", lessons: [{ id: 1, title: "Finding elements" }, { id: 2, title: "Changing text" }, { id: 3, title: "Changing styles" }, { id: 4, title: "Button clicks" }, { id: 5, title: "Unit challenge" }] },
      { id: 11, title: "Classes", description: "Build your own blueprints", lessons: [{ id: 1, title: "Defining a class" }, { id: 2, title: "The constructor" }, { id: 3, title: "Properties" }, { id: 4, title: "Methods" }, { id: 5, title: "Unit challenge" }] },
      { id: 12, title: "Final Project", description: "Build a real JavaScript app", lessons: [{ id: 1, title: "Planning your project" }, { id: 2, title: "Building the structure" }, { id: 3, title: "Adding features" }, { id: 4, title: "Testing and fixing" }, { id: 5, title: "Final challenge" }] },
    ],
  },
];

const MINI_COURSES: Record<LearningLanguage, MiniCourseMeta[]> = {
  python: [
    {
      id: "turtle",
      title: "Turtle Graphics",
      subtitle: "Draw with code",
      description: "Learn loops, angles, and functions by moving a turtle around the screen.",
      status: "live",
      badge: "TG",
      href: "/labs/python/turtle",
    },
    {
      id: "random",
      title: "Random",
      subtitle: "Games and surprises",
      description: "Use random choices and numbers to make quizzes, dice, and small games.",
      status: "planned",
      badge: "RD",
    },
    {
      id: "pygame-zero",
      title: "Pygame Zero",
      subtitle: "Tiny game projects",
      description: "Build beginner-friendly arcade games with sprites, movement, and scorekeeping.",
      status: "planned",
      badge: "PG",
    },
  ],
  javascript: [
    {
      id: "fetch-api",
      title: "Fetch API",
      subtitle: "Talk to the internet",
      description: "Load JSON, call APIs, and build projects that use real-world data.",
      status: "coming_soon",
      badge: "FX",
    },
    {
      id: "canvas",
      title: "Canvas",
      subtitle: "Draw in the browser",
      description: "Make interactive sketches, particle effects, and simple game scenes with JavaScript.",
      status: "planned",
      badge: "CV",
    },
    {
      id: "dom-projects",
      title: "DOM Projects",
      subtitle: "Mini app builds",
      description: "Practice events, forms, and UI updates by making small interactive tools.",
      status: "planned",
      badge: "DM",
    },
  ],
};

const LESSON_TOPICS: Record<LearningLanguage, Record<string, Record<string, string>>> = {
  python: {
    "1": { "1": "the print() function in Python and how to display text on the screen using print('hello')", "2": "printing numbers in Python using print() with integers and floats like print(42)", "3": "printing multiple things in Python using commas in print() like print('hello', 'world')", "4": "comments in Python using the # symbol to write notes in code" },
    "2": { "1": "creating variables in Python like name = 'Alice' or age = 25", "2": "rules for naming variables in Python. No spaces, no special characters, case sensitive", "3": "changing a variable value in Python by reassigning it", "4": "printing variables in Python using print(variable_name)" },
    "3": { "1": "the input() function in Python is how to get text from the user using input('Enter your name: ')", "2": "storing user input in a variable like name = input('Your name: ')", "3": "converting input to a number using int(input()) or float(input())", "4": "using input values inside print() statements" },
    "4": { "1": "joining strings in Python using the + operator like 'hello' + ' world'", "2": "string length in Python using the len() function", "3": "upper() and lower() string methods in Python", "4": "f-strings in Python like f'Hello {name}' to insert variables into strings" },
    "5": { "1": "if statements in Python to run code only when a condition is True", "2": "else statements in Python to run code when the if condition is False", "3": "elif statements in Python to check multiple conditions", "4": "combining conditions in Python using and, or, not" },
    "6": { "1": "while loops in Python to repeat code while a condition is True", "2": "for loops in Python to repeat code a set number of times", "3": "the range() function in Python for loops like for i in range(5)", "4": "break and continue in Python to control loops" },
    "7": { "1": "defining a function in Python using the def keyword like def greet():", "2": "calling a function in Python by writing its name like greet()", "3": "function parameters in Python like def add(a, b):", "4": "return values in Python using the return keyword" },
    "8": { "1": "creating a list in Python like fruits = ['apple', 'banana', 'cherry']", "2": "accessing list items in Python using index like fruits[0]", "3": "adding and removing items from a list using append() and remove()", "4": "looping through a list in Python using a for loop" },
    "9": { "1": "creating a dictionary in Python like person = {'name': 'Alice', 'age': 25}", "2": "accessing dictionary values in Python using keys like person['name']", "3": "adding and updating dictionary entries in Python", "4": "looping through a dictionary in Python using for key in dict" },
    "10": { "1": "opening a file in Python using open() with read mode 'r' or write mode 'w'", "2": "reading a file in Python using file.read() or file.readlines()", "3": "writing to a file in Python using file.write()", "4": "closing files properly in Python using file.close() or with open()" },
    "11": { "1": "defining a class in Python using the class keyword like class Dog:", "2": "the __init__ method in Python classes to set up attributes", "3": "class attributes in Python using self.name = name", "4": "class methods in Python are functions that belong to a class" },
    "12": { "1": "planning a Python project is breaking a problem into small steps before writing any code", "2": "building the structure of a Python program using functions and variables together", "3": "adding features to a Python program step by step using everything learned so far", "4": "testing and fixing bugs in a Python program using print statements and logic checks" },
  },
  javascript: {
    "1": { "1": "the console.log() function in JavaScript and how to display text on the screen using console.log('hello')", "2": "logging numbers in JavaScript using console.log() with integers and decimals like console.log(42)", "3": "logging multiple values in JavaScript using commas in console.log() like console.log('hello', 'world')", "4": "comments in JavaScript using // to write notes in code" },
    "2": { "1": "creating variables in JavaScript like let name = 'Alice' or const age = 25", "2": "the difference between let and const in JavaScript and when to use each one", "3": "changing a variable value in JavaScript by reassigning it", "4": "logging variables in JavaScript using console.log(variableName)" },
    "3": { "1": "the prompt() function in JavaScript is how to get text from the user using prompt('Enter your name:')", "2": "storing user input in a variable like const name = prompt('Your name:')", "3": "turning prompt input into a number using Number(prompt())", "4": "using input values inside console.log() statements" },
    "4": { "1": "joining strings in JavaScript using the + operator like 'hello' + ' world'", "2": "string length in JavaScript using the .length property", "3": "toUpperCase() and toLowerCase() string methods in JavaScript", "4": "template literals in JavaScript like `Hello ${name}` to insert variables into strings" },
    "5": { "1": "if statements in JavaScript to run code only when a condition is true", "2": "else statements in JavaScript to run code when the if condition is false", "3": "else if statements in JavaScript to check multiple conditions", "4": "combining conditions in JavaScript using &&, ||, and !" },
    "6": { "1": "while loops in JavaScript to repeat code while a condition is true", "2": "for loops in JavaScript to repeat code a set number of times", "3": "loop counters in JavaScript like for (let i = 0; i < 5; i++)", "4": "break and continue in JavaScript to control loops" },
    "7": { "1": "defining a function in JavaScript using the function keyword like function greet() {}", "2": "calling a function in JavaScript by writing its name like greet()", "3": "function parameters in JavaScript like function add(a, b) {}", "4": "return values in JavaScript using the return keyword" },
    "8": { "1": "creating an array in JavaScript like const fruits = ['apple', 'banana', 'cherry']", "2": "accessing array items in JavaScript using index like fruits[0]", "3": "adding and removing items from an array using push() and pop()", "4": "looping through an array in JavaScript using a for loop or for...of" },
    "9": { "1": "creating an object in JavaScript like const person = { name: 'Alice', age: 25 }", "2": "accessing object values in JavaScript using dot notation like person.name or brackets like person['name']", "3": "adding and updating object properties in JavaScript", "4": "looping through an object in JavaScript using Object.keys() or for...in" },
    "10": { "1": "finding an HTML element in JavaScript using document.querySelector()", "2": "changing text on a web page in JavaScript using textContent", "3": "changing styles in JavaScript using element.style", "4": "responding to button clicks in JavaScript using addEventListener" },
    "11": { "1": "defining a class in JavaScript using the class keyword like class Dog {}", "2": "the constructor method in JavaScript classes to set up properties", "3": "class properties in JavaScript using this.name = name", "4": "class methods in JavaScript are functions that belong to a class" },
    "12": { "1": "planning a JavaScript project by breaking a problem into small steps before writing code", "2": "building the structure of a JavaScript app using functions, variables, and page elements together", "3": "adding features to a JavaScript app step by step using everything learned so far", "4": "testing and fixing bugs in a JavaScript app using console.log and careful checks" },
  },
};

const UNIT_CHALLENGES: Record<LearningLanguage, Record<string, UnitChallenge>> = {
  python: {
    "1": { title: "Hello World Challenge", description: "Use what you learned about print() and comments to complete this challenge.", prompt: `Write a Python program that:
1. Prints your name
2. Prints your age
3. Prints "I am learning Python!"
4. Has at least one comment explaining what your code does`, exampleOutput: `Alice
25
I am learning Python!` },
    "2": { title: "Variables Challenge", description: "Use variables to store and display information.", prompt: `Write a Python program that:
1. Creates a variable called "name" with your name
2. Creates a variable called "age" with your age
3. Creates a variable called "city" with your city
4. Prints all three variables`, exampleOutput: `Alice
25
New York` },
    "3": { title: "User Input Challenge", description: "Build a simple interactive program using input().", prompt: `Write a Python program that:
1. Asks the user for their name using input()
2. Asks the user for their favorite color
3. Prints a message combining both, like "Hi Alice! Your favorite color is blue."`, exampleOutput: `Hi Alice! Your favorite color is blue.` },
    "4": { title: "Strings Challenge", description: "Use string operations to manipulate text.", prompt: `Write a Python program that:
1. Creates a variable with your full name
2. Prints your name in ALL CAPS
3. Prints how many characters are in your name
4. Prints a greeting using an f-string like "Hello, my name is Alice!"`, exampleOutput: `ALICE SMITH
11
Hello, my name is Alice Smith!` },
    "5": { title: "Conditions Challenge", description: "Write a program that makes decisions.", prompt: `Write a Python program that:
1. Creates a variable called "score" with a number between 0 and 100
2. Prints "A" if score is 90 or above
3. Prints "B" if score is 80-89
4. Prints "C" if score is 70-79
5. Prints "F" if score is below 70`, exampleOutput: `B` },
    "6": { title: "Loops Challenge", description: "Use loops to repeat code.", prompt: `Write a Python program that:
1. Uses a for loop to print the numbers 1 through 10
2. Uses a while loop to count down from 5 to 1
3. Prints "Blast off!" at the end`, exampleOutput: `1
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
Blast off!` },
    "7": { title: "Functions Challenge", description: "Write and use your own functions.", prompt: `Write a Python program that:
1. Defines a function called "greet" that takes a name and prints "Hello, [name]!"
2. Defines a function called "add" that takes two numbers and returns their sum
3. Calls greet() with your name
4. Calls add() with two numbers and prints the result`, exampleOutput: `Hello, Alice!
15` },
    "8": { title: "Lists Challenge", description: "Work with lists of data.", prompt: `Write a Python program that:
1. Creates a list of 5 of your favorite foods
2. Prints the first and last item in the list
3. Adds a new food to the list
4. Prints how many items are in the list
5. Loops through the list and prints each item`, exampleOutput: `pizza
sushi
6
pizza
burger
tacos
ramen
sushi
ice cream` },
    "9": { title: "Dictionaries Challenge", description: "Use dictionaries to store structured data.", prompt: `Write a Python program that:
1. Creates a dictionary called "person" with keys: name, age, city, hobby
2. Prints each value using its key
3. Adds a new key called "language" with value "Python"
4. Prints all keys and values using a loop`, exampleOutput: `Alice
25
New York
coding
name: Alice
age: 25
city: New York
hobby: coding
language: Python` },
    "10": { title: "File Handling Challenge", description: "Read and write files.", prompt: `Write a Python program that:
1. Creates a file called "notes.txt" and writes three lines to it
2. Closes the file
3. Opens the file again and reads all the content
4. Prints the content`, exampleOutput: `Line 1
Line 2
Line 3` },
    "11": { title: "Classes Challenge", description: "Build your own class.", prompt: `Write a Python program that:
1. Defines a class called "Dog" with attributes: name, breed, age
2. Adds a method called "bark" that prints "[name] says: Woof!"
3. Adds a method called "info" that prints the dog's name, breed and age
4. Creates two Dog objects and calls both methods on each`, exampleOutput: `Rex says: Woof!
Name: Rex, Breed: Labrador, Age: 3
Buddy says: Woof!
Name: Buddy, Breed: Poodle, Age: 5` },
    "12": { title: "Final Project Challenge", description: "Build a complete Python program using everything you learned.", prompt: `Build a simple contact book program that:
1. Has a dictionary to store contacts (name -> phone number)
2. Has a function to add a contact
3. Has a function to look up a contact by name
4. Has a function to display all contacts
5. Demonstrates all three functions working`, exampleOutput: `Contact added: Alice - 555-1234
Looking up Alice: 555-1234
All contacts:
Alice: 555-1234
Bob: 555-5678` },
  },
  javascript: {
    "1": { title: "Hello Console Challenge", description: "Use console.log() and comments to complete this challenge.", prompt: `Write a JavaScript program that:
1. Logs your name
2. Logs your age
3. Logs "I am learning JavaScript!"
4. Has at least one comment explaining what your code does`, exampleOutput: `Alice
25
I am learning JavaScript!` },
    "2": { title: "Variables Challenge", description: "Use variables to store and display information.", prompt: `Write a JavaScript program that:
1. Creates a variable called name with your name
2. Creates a variable called age with your age
3. Creates a variable called city with your city
4. Logs all three variables`, exampleOutput: `Alice
25
New York` },
    "3": { title: "User Input Challenge", description: "Build a simple interactive program using prompt().", prompt: `Write a JavaScript program that:
1. Asks the user for their name using prompt()
2. Asks the user for their favorite color
3. Logs a message combining both, like "Hi Alice! Your favorite color is blue."`, exampleOutput: `Hi Alice! Your favorite color is blue.` },
    "4": { title: "Strings Challenge", description: "Use string operations to manipulate text.", prompt: `Write a JavaScript program that:
1. Creates a variable with your full name
2. Logs your name in ALL CAPS
3. Logs how many characters are in your name
4. Logs a greeting using a template literal like "Hello, my name is Alice!"`, exampleOutput: `ALICE SMITH
11
Hello, my name is Alice Smith!` },
    "5": { title: "Conditions Challenge", description: "Write a program that makes decisions.", prompt: `Write a JavaScript program that:
1. Creates a variable called score with a number between 0 and 100
2. Logs "A" if score is 90 or above
3. Logs "B" if score is 80-89
4. Logs "C" if score is 70-79
5. Logs "F" if score is below 70`, exampleOutput: `B` },
    "6": { title: "Loops Challenge", description: "Use loops to repeat code.", prompt: `Write a JavaScript program that:
1. Uses a for loop to log the numbers 1 through 10
2. Uses a while loop to count down from 5 to 1
3. Logs "Blast off!" at the end`, exampleOutput: `1
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
Blast off!` },
    "7": { title: "Functions Challenge", description: "Write and use your own functions.", prompt: `Write a JavaScript program that:
1. Defines a function called greet that takes a name and logs "Hello, [name]!"
2. Defines a function called add that takes two numbers and returns their sum
3. Calls greet() with your name
4. Calls add() with two numbers and logs the result`, exampleOutput: `Hello, Alice!
15` },
    "8": { title: "Arrays Challenge", description: "Work with arrays of data.", prompt: `Write a JavaScript program that:
1. Creates an array of 5 of your favorite foods
2. Logs the first and last item in the array
3. Adds a new food to the array
4. Logs how many items are in the array
5. Loops through the array and logs each item`, exampleOutput: `pizza
sushi
6
pizza
burger
tacos
ramen
sushi
ice cream` },
    "9": { title: "Objects Challenge", description: "Use objects to store structured data.", prompt: `Write a JavaScript program that:
1. Creates an object called person with keys: name, age, city, hobby
2. Logs each value using its key
3. Adds a new key called language with value "JavaScript"
4. Logs all keys and values using a loop`, exampleOutput: `Alice
25
New York
coding
name: Alice
age: 25
city: New York
hobby: coding
language: JavaScript` },
    "10": { title: "DOM Challenge", description: "Update a web page with JavaScript.", prompt: `Write JavaScript that:
1. Selects an element with the id "message"
2. Changes its text to "Hello from JavaScript!"
3. Changes its color to blue
4. Adds a click handler to a button with the id "changeBtn" that updates the text again`, exampleOutput: `Hello from JavaScript!` },
    "11": { title: "Classes Challenge", description: "Build your own class.", prompt: `Write a JavaScript program that:
1. Defines a class called Dog with properties: name, breed, age
2. Adds a method called bark that logs "[name] says: Woof!"
3. Adds a method called info that logs the dog's name, breed and age
4. Creates two Dog objects and calls both methods on each`, exampleOutput: `Rex says: Woof!
Name: Rex, Breed: Labrador, Age: 3
Buddy says: Woof!
Name: Buddy, Breed: Poodle, Age: 5` },
    "12": { title: "Final Project Challenge", description: "Build a complete JavaScript program using everything you learned.", prompt: `Build a simple contact book program that:
1. Has an object to store contacts (name -> phone number)
2. Has a function to add a contact
3. Has a function to look up a contact by name
4. Has a function to display all contacts
5. Demonstrates all three functions working`, exampleOutput: `Contact added: Alice - 555-1234
Looking up Alice: 555-1234
All contacts:
Alice: 555-1234
Bob: 555-5678` },
  },
};

export function normalizeLanguage(language?: string | null): LearningLanguage {
  return language === "javascript" ? "javascript" : "python";
}

export function getLanguageLabel(language?: string | null): string {
  return normalizeLanguage(language) === "javascript" ? "JavaScript" : "Python";
}

export function getCourseSections(language?: string | null): SectionMeta[] {
  return normalizeLanguage(language) === "javascript" ? JAVASCRIPT_SECTIONS : PYTHON_SECTIONS;
}

export function getMiniCourses(language?: string | null): MiniCourseMeta[] {
  return MINI_COURSES[normalizeLanguage(language)];
}

export function getLessonTopic(language: string | null | undefined, unitId: string, lessonId: string): string {
  const normalizedLanguage = normalizeLanguage(language);
  return LESSON_TOPICS[normalizedLanguage]?.[unitId]?.[lessonId] || `${getLanguageLabel(normalizedLanguage)} basics`;
}

export function getUnitChallenge(language: string | null | undefined, unitId: string): UnitChallenge | null {
  const normalizedLanguage = normalizeLanguage(language);
  return UNIT_CHALLENGES[normalizedLanguage]?.[unitId] || null;
}
