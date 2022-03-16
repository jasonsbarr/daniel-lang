import { tokenize } from "./tokenizer.js";

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
  const replaceEscape = (c) =>
    c === "\\\\"
      ? "\\"
      : c === "\\'"
      ? "'"
      : c === '\\"'
      ? '"'
      : c === "\\n"
      ? "\n"
      : c === "\\b"
      ? "\b"
      : c === "\\f"
      ? "\f"
      : c === "\\r"
      ? "\r"
      : c === "\\t"
      ? "\t"
      : c === "\\v"
      ? "\v"
      : c;
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

  return { ...token, value: Symbol.for(token.text) };
};

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
