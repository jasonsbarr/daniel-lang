class LexerError extends Error {
  constructor(char, line, col) {
    super(`Invalid token ${char} at (${line}:${col})`);
  }
}

/**
 * A Token represents a single lexeme
 */
class Token {
  /**
   * A token contains all the information necessary for evaluating it
   *
   * @param {String} type
   * @param {String} name
   * @param {String} text
   * @param {Number} line
   * @param {Number} col
   * @param {Number} pos
   */
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

/**
 * Creates a rule for token creation
 *
 * @param {String} name
 * @param {String} regex
 * @returns {Object}
 */
const rule = (name, regex) => ({ name, regex });
