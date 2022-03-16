import readlineSync from "readline-sync";

export const readline = () => readlineSync.question("");

export const input = (prompt) => readlineSync.question(prompt);
