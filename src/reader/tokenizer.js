class LexerError extends Error {
  constructor(char, line, col) {
    super(`Invalid token ${char} at (${line}:${col})`);
  }
}

/**
 * A Token represents a single lexeme
 */
class Token {
  constructor(type, name, text, line, col, pos) {
    this.type = type;
    this.name = name;
    this.text = text;
    this.line = line;
    this.col = col;
    this.pos = pos;
  }

  toString() {
    return `Token(type=${this.type}, value=${this.text})`;
  }
}

const token = (type, name, text, line, col, pos) =>
  new Token(type, name, text, line, col, pos);

const rule = (type, regex) => ({ type, regex });
