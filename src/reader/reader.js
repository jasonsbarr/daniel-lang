import { Token, tokenize } from "./tokenizer.js";

/**
 * Parsing error class
 */
class ReadError extends Error {
  constructor(text, line, col, file) {
    super(`Invalid token ${text} at ${file} ${line}:${col}`);
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
    return {
      type: token.type,
      value: Number(token.text),
      syntax: {
        line: token.line,
        col: token.col,
        file: token.file,
        pos: token.pos,
        text: token.text,
      },
    };
  }

  if (token.match("Nil")) {
    return {
      type: token.type,
      value: null,
      syntax: {
        line: token.line,
        col: token.col,
        file: token.file,
        pos: token.pos,
        text: token.text,
      },
    };
  }

  if (token.match("Boolean")) {
    return {
      type: token.type,
      value: token.text === "true",
      syntax: {
        line: token.line,
        col: token.col,
        file: token.file,
        pos: token.pos,
        text: token.text,
      },
    };
  }

  if (token.match("String")) {
    return {
      type: token.type,
      value: replaceEscapeChars(token.text.slice(1, -1)),
      syntax: {
        line: token.line,
        col: token.col,
        file: token.file,
        pos: token.pos,
        text: token.text,
      },
    };
  }

  if (token.match("Symbol")) {
    return {
      type: token.type,
      value: Symbol.for(token.text),
      syntax: {
        line: token.line,
        col: token.col,
        file: token.file,
        pos: token.pos,
        text: token.text,
      },
    };
  }

  if (token.match("Keyword")) {
    return {
      type: token.type,
      value: Symbol.for(token.text),
      syntax: {
        line: token.line,
        col: token.col,
        file: token.file,
        pos: token.pos,
        text: token.text,
      },
    };
  }

  throw new ReadError(token.text, token.line, token.col, token.file);
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
    // console.log(reader.tokens[reader.pos + 1]);
    throw new ReadError(token.text, token.line, token.col, token.file);
  }

  if (reader.peek().match(end)) {
    // skip over end paren
    reader.next();
    return ast;
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
      throw new ReadError("EOF", t.line, t.col, t.file);
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
  const { line, col, pos, file } = reader.peek();
  return {
    type: "ListPattern",
    value: readList(reader, "LBrack", "RBrack"),
    syntax: { line, col, pos, file },
  };
};

/**
 * Reads a hash literal demarcated with []
 * @param {Reader} reader
 */
const readHashLiteral = (reader) => {
  const { line, col, pos, file } = reader.peek();
  return {
    type: "HashPattern",
    value: readList(reader, "LBrace", "RBrace"),
    syntax: { line, col, pos, file },
  };
};

/**
 * Read a varargs operator
 * @param {Reader} reader
 */
const readAmp = (reader) => {
  const { text, line, col, pos, file } = reader.next();
  return {
    type: "Amp",
    value: "&",
    syntax: { text, line, col, pos, file },
  };
};

/**
 * Read a module starting with module-begin
 * @param {Reader} reader
 */
const readModule = (reader) => {
  const token = reader.next();
  const modExprs = [];
  const mod = {
    type: "Module",
    value: Symbol.for("begin-module"),
    exprs: modExprs,
    syntax: {
      text: "begin-module",
      line: token.line,
      col: token.col,
      pos: token.pos,
      file: token.file,
    },
  };

  while (reader.peek().type !== "RParen") {
    modExprs.push(readForm(reader));
  }

  return mod;
};

/**
 * Dispatcher function for token stream reader
 * @param {Reader} reader
 */
const readForm = (reader) => {
  let token = reader.peek();

  switch (token.type) {
    case "Quote":
      token = reader.next();
      return [
        {
          type: "Quote",
          value: Symbol.for("quote"),
          syntax: {
            text: "'",
            line: token.line,
            col: token.col,
            pos: token.pos,
            file: token.file,
          },
        },
        readForm(reader),
      ];
    case "QQuote":
      token = reader.next();
      return [
        {
          type: "Quasiquote",
          value: Symbol.for("quasiquote"),
          syntax: {
            text: "`",
            line: token.line,
            col: token.col,
            pos: token.pos,
            file: token.file,
          },
        },
        readForm(reader),
      ];
    case "UQuote":
      token = reader.next();
      return [
        {
          type: "Unquote",
          value: Symbol.for("unquote"),
          syntax: {
            text: "~",
            line: token.line,
            col: token.col,
            pos: token.pos,
            file: token.file,
          },
        },
        readForm(reader),
      ];
    case "SUQuote":
      token = reader.next();
      return [
        {
          type: "SpliceUnquote",
          value: Symbol.for("splice-unquote"),
          syntax: {
            text: "~@",
            line: token.line,
            col: token.col,
            pos: token.pos,
            file: token.file,
          },
        },
        readForm(reader),
      ];
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
    case "Amp":
      return readAmp(reader);
    case "Module":
      return readModule(reader);
    default:
      return readAtom(reader);
  }
};

export const read = (input, file) => {
  // filter out all whitespace and comments
  const tokens = tokenize(input, file).filter(
    (t) => t.type !== "WS" && t.type !== "Comment"
  );
  const reader = new Reader(tokens);
  const first = reader.tokens[0];
  let begin;

  if (first) {
    begin = {
      type: "Symbol",
      value: Symbol.for("begin"),
      syntax: {
        text: "begin",
        line: first.line,
        col: first.col,
        pos: first.pos,
        file: first.file,
      },
    };
  } else {
    begin = {
      type: "Symbol",
      value: Symbol.for("begin"),
      syntax: { text: "begin", line: 0, col: 0, pos: 0, file: "" },
    };
  }

  let prog = [begin];

  while (reader.pos < reader.length) {
    let expr = readForm(reader);

    if (expr) {
      prog.push(expr);
    }
  }

  return prog;
};
