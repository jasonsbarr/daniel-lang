class LexerError extends Error {
  constructor(char, line, col) {
    super(`Invalid token ${char} at (${line}:${col})`);
  }
}
