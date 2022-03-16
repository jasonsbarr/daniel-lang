import { tokenize } from "./tokenizer.js";

/**
 * Parsing error class
 */
class ReadError extends Error {
  constructor(text, line, col) {
    super(`Unknown token ${text} at ${line}:${col}`);
  }
}

/**
 * Manages the state of the token stream
 */
class Reader {
  /**
   * @param {Token[]} tokens
   */
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.length = tokens.length;
  }

  next() {
    return this.tokens[this.pos++];
  }

  peek() {
    return this.tokens[this.pos];
  }
}

/**
 * Replace raw escape sequences with the actual escape characters
 * @param {String} str
 */
const replaceEscapeChars = (str) => {
  const uE = /\\u\p{Hex_Digit}{1,6}/gu;
  const eC = /\\[\\'"bfnrtv]/g;
  const replaceUnicodeEscape = (m) =>
    String.fromCodePoint(parseInt(m.slice(2), 16));
  const replaceEscape = (m) =>
    m === "\\\\"
      ? "\\"
      : m === "\\'"
      ? "'"
      : m === '\\"'
      ? '"'
      : m === "\\n"
      ? "\n"
      : m === "\\b"
      ? "\b"
      : m === "\\f"
      ? "\f"
      : m === "\\r"
      ? "\r"
      : m === "\\t"
      ? "\t"
      : m === "\\v"
      ? "\v"
      : m;
  str = str.replace(uE, replaceUnicodeEscape);
  str = str.replace(eC, replaceEscape);
  return str;
};

/**
 * Reads atomic types into syntax objects
 * @param {Reader} reader
 */
const readAtom = (reader) => {
  const token = reader.next();

  if (token.match("Number")) {
    return { ...token, value: Number(token.text) };
  }

  if (token.match("Nil")) {
    return { ...token, value: null };
  }

  if (token.match("Boolean")) {
    return { ...token, value: token.text === "true" };
  }

  if (token.match("String")) {
    return { ...token, value: replaceEscapeChars(token.text.slice(1, -1)) };
  }

  if (token.match("Symbol")) {
    return { ...token, value: Symbol.for(token.text) };
  }

  throw new ReadError(token.text, token.line, token.col);
};

/**
 * Read a list demarcated by (), [], or {}
 * @param {Reader} reader
 * @returns {Object[]}
 */
const readList = (reader, start = "LParen", end = "RParen") => {};

/**
 * Dispatcher function for token stream reader
 * @param {Reader} reader
 */
const readForm = (reader) => {
  const token = reader.peek();

  if (token.match("Comment") || token.match("WS")) {
    // skip
    reader.next();
    return null;
  }

  switch (token.type) {
    default:
      return readAtom(reader);
  }
};

export const read = (input) => {
  const reader = new Reader(tokenize(input));
  let prog = [];

  while (reader.pos < reader.length) {
    let expr = readForm(reader);

    if (expr) {
      prog.push(expr);
    }
  }

  return prog;
};
