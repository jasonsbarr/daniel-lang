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

/**
 * Manages the state of the input stream as the lexer processes it
 */
class InputStream {
  /**
   * Sets the InputStream initial state
   * @param {String} buffer
   */
  constructor(buffer) {
    this.buffer = buffer;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.length = buffer.length;
  }

  advance(pos) {
    this.pos = pos;

    if (/\r?\n/g.exec(this.buffer[pos])) {
      this.line += 1;
      this.col = 0;
    } else {
      this.col += 1;
    }
  }

  eof() {
    return this.pos >= this.length;
  }

  toString() {
    return `[object InputStream length=${this.length}]`;
  }
}

class Lexer {
  constructor(rules) {
    this.rules = rules;
    this.groups = {};
    this.regex = this.compile();
  }

  /**
   * Concatenates the provided rules into a single regular expression
   * @returns {RegExp}
   */
  compile() {
    let reFrags = [];
    let i = 1;

    for (let { type, name, regex } of this.rules) {
      let groupName = `${name}${i++}`;
      reFrags.push(`(?<${groupName}>` + regex + `)`);
      this.groups[groupName] = { type, name };
    }

    return new RegExp(reFrags.join("|"), "u");
  }

  /**
   * Takes the lexer input as a string and converts it to an InputStream
   * @param {String} inputStr
   * @returns {Lexer}
   */
  input(inputStr) {
    this.inputStr = new InputStream(inputStr);

    return this;
  }

  /**
   * Matches a rule with the current position of the input stream and creates a Token
   * @returns {Token}
   */
  token() {
    let { buffer, pos, line, col } = this.inputStr;

    if (this.inputStr.eof()) {
      return null;
    }

    let m = this.regex.exec(buffer.slice(pos));

    if (m) {
      let groupName;

      for (let [k, v] of Object.entries(m.groups)) {
        if (v !== undefined) {
          groupName = k;
          break;
        }
      }

      let { type, name } = this.groups[groupName];
      let value = m[0];
      let tok = token(type, name, value, line, col, pos);

      this.inputStr.advance(pos + value.length);

      return tok;
    }

    // if it gets here, nothing matched
    throw new LexerError(buffer[pos], line, col);
  }

  /**
   * Returns an array of the tokens found in the input buffer
   * @returns {Token[]}
   */
  tokenize() {
    let tokens = [];
    while (!this.inputStr.eof()) {
      let tok = this.token();

      if (tok !== null) {
        tokens.push(tok);
      }
    }

    let { line, col, pos } = this.inputStr;

    tokens.push(
      token("EndOfInput", "ENDOFINPUT", "EndOfInput", line, col, pos)
    );

    return tokens;
  }
}
