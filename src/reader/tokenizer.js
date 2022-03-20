class LexerError extends Error {
  constructor(char, line, col) {
    super(`Invalid token ${char} at (${line}:${col})`);
  }
}

/**
 * A Token represents a single lexeme
 */
export class Token {
  /**
   * A token contains all the information necessary for evaluating it
   *
   * @param {String} type
   * @param {String} text
   * @param {Number} line
   * @param {Number} col
   * @param {Number} pos
   * @param {String} file
   */
  constructor(type, text, line, col, pos, file) {
    this.type = type;
    this.text = text;
    this.line = line;
    this.col = col;
    this.pos = pos;
    this.file = file;
  }

  match(type) {
    return this.type === type;
  }

  toString() {
    return `Token(type=${this.type}, value=${this.text})`;
  }
}

export const token = (type, text, line, col, pos, file) =>
  new Token(type, text, line, col, pos, file);

/**
 * Creates a rule for token creation
 *
 * @param {String} type
 * @param {String} regex
 * @returns {Object}
 */
const rule = (type, regex) => ({ type, regex });

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

    for (let { type, regex } of this.rules) {
      let groupName = `${type}${i++}`;
      reFrags.push(`(?<${groupName}>` + regex + `)`);
      this.groups[groupName] = type;
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
  token(file) {
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

      let type = this.groups[groupName];
      let value = m[0];
      let tok = token(type, value, line, col, pos, file);

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
  tokenize(file) {
    let tokens = [];
    while (!this.inputStr.eof()) {
      let tok = this.token(file);

      if (tok !== null) {
        tokens.push(tok);
      }
    }

    return tokens;
  }
}

/**
 * Rules for creating tokens
 */
const NIL = rule("Nil", String.raw`nil`);
const BOOL = rule("Boolean", String.raw`true|false`);
const STRING = rule("String", String.raw`"(?:\\.|[^\\"])*"?`);
const NUMBER = rule("Number", String.raw`[-\+]?[0-9]*\.?[0-9]+`);
const COMMENT = rule("Comment", String.raw`;.*`);
const WS = rule("WS", String.raw`\s+`);
const LPAREN = rule("LParen", String.raw`\(`);
const RPAREN = rule("RParen", String.raw`\)`);
const LBRACK = rule("LBrack", String.raw`\[`);
const RBRACK = rule("RBrack", String.raw`\]`);
const LBRACE = rule("LBrace", String.raw`\{`);
const RBRACE = rule("RBrace", String.raw`\}`);
const SYMBOL = rule(
  "Symbol",
  String.raw`[:=<>%:\|\?\\\/\*\.\p{L}_\$!\+-][:=@~<>%:&\|\?\\\/\^\*\.&#'\p{L}\p{N}_\$!\+-]*`
);

const rules = [
  NIL,
  BOOL,
  STRING,
  NUMBER,
  COMMENT,
  WS,
  LPAREN,
  RPAREN,
  LBRACK,
  RBRACK,
  LBRACE,
  RBRACE,
  SYMBOL,
];

const lexer = new Lexer(rules);

export const tokenize = (input, file = "<stdin>") =>
  lexer.input(input).tokenize(file);
