export async function POST() {
  const challenges = [
    {
      title: "Print a Pyramid",
      prompt: "Write a Python program that prints a pyramid of stars like this:\n*\n**\n***\n****\n*****",
      exampleOutput: "*\n**\n***\n****\n*****",
    },
    {
      title: "FizzBuzz",
      prompt: "Write a Python program that prints numbers 1 to 20. But for multiples of 3 print 'Fizz', for multiples of 5 print 'Buzz', and for multiples of both print 'FizzBuzz'.",
      exampleOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz",
    },
    {
      title: "Reverse a String",
      prompt: "Write a Python program that asks the user for a word and prints it backwards.",
      exampleOutput: "Enter a word: hello\nolleh",
    },
    {
      title: "Even or Odd",
      prompt: "Write a Python program that asks the user for a number and prints whether it is even or odd.",
      exampleOutput: "Enter a number: 7\n7 is odd",
    },
    {
      title: "Sum of a List",
      prompt: "Write a Python program that creates a list of 5 numbers and prints their sum and average.",
      exampleOutput: "Sum: 25\nAverage: 5.0",
    },
    {
      title: "Countdown Timer",
      prompt: "Write a Python program that counts down from 10 to 1 and then prints 'Go!'",
      exampleOutput: "10\n9\n8\n7\n6\n5\n4\n3\n2\n1\nGo!",
    },
    {
      title: "Multiplication Table",
      prompt: "Write a Python program that asks the user for a number and prints its multiplication table from 1 to 10.",
      exampleOutput: "Enter a number: 3\n3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9",
    },
  ];

  // Pick challenge based on day of year so everyone gets the same one each day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const challenge = challenges[dayOfYear % challenges.length];

  return Response.json(challenge);
}