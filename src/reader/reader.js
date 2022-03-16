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
 * Reads atomic types into syntax objects
 * @param {Reader} reader
 */
const readAtom = (reader) => {
  const token = reader.next();

  if (token.match("Comment") || token.match("WS")) {
    return null;
  }

  if (token.match("Number")) {
    return { ...token, value: Number(token.text) };
  }
};

/**
 * Dispatcher function for token stream reader
 * @param {Reader} reader
 */
const readForm = (reader) => {
  const token = reader.peek();

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
