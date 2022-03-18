const readlineSync = require("readline-sync");

const readline = () => readlineSync.question("");

const input = (prompt) => readlineSync.question(prompt);

const print = (input) => console.log(input);

module.exports = {
  readline,
  input,
  print,
};
