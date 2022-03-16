import { tokenize } from "./tokenizer.js";

class Reader {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  next() {
    return this.tokens[this.pos++];
  }

  peek() {
    return this.tokens[this.pos];
  }
}

const readAtom = (reader) => {};

export const read = (input) => {
  const reader = new Reader(tokenize(input));
};
