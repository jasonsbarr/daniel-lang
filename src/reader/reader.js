import { Token, token, tokenize } from "./tokenizer.js";

/**
 * Parsing error class
 */
class ReadError extends Error {
  constructor(text, line, col) {
    super(`Invalid token ${text} at ${line}:${col}`);
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

  /**
   * Get the current token and advance the stream
   * @returns {Token}
   */
  next() {
    return this.tokens[this.pos++];
  }

  /**
   * Get the current token without advancing the stream
   * @returns {Token}
   */
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
const readList = (reader, start = "LParen", end = "RParen") => {
  let ast = [];
  let token = reader.next();

  if (!token.match(start)) {
    throw new ReadError(token.text, token.line, token.col);
  }

  while (!token.match(end)) {
    const expr = readForm(reader);

    if (expr) {
      ast.push(expr);
    }

    // get previous token in case of EOF
    let t = reader.tokens[reader.pos - 1];
    token = reader.peek();

    if (!token) {
      throw new ReadError("EOF", t.line, t.col);
    }
  }

  // skip end token
  reader.next();
  return ast;
};

/**
 * Reads a list literal demarcated with []
 * @param {Reader} reader
 */
const readListLiteral = (reader) => {
  const { line, col, pos } = reader.peek();
  return {
    type: "ListPattern",
    line,
    col,
    pos,
    value: readList(reader, "LBrack", "RBrack"),
  };
};

/**
 * Reads a hash literal demarcated with []
 * @param {Reader} reader
 */
const readHashLiteral = (reader) => {
  const { line, col, pos } = reader.peek();
  return {
    type: "HashPattern",
    line,
    col,
    pos,
    value: readList(reader, "LBrace", "RBrace"),
  };
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
    case "RParen":
    case "RBrack":
    case "RBrace":
      throw new ReadError(token.text, token.line, token.col);
    case "LParen":
      return readList(reader, "LParen", "RParen");
    case "LBrack":
      return readListLiteral(reader);
    case "LBrace":
      return readHashLiteral(reader);
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
