import { TyError } from "../../lib/js/error.js";
import { getType } from "../../lib/js/base.js";

const checkNumeric = (obj) => {
  if (typeof obj !== "number") {
    throw new TyError("number", getType(obj));
  }
};

export class Range {
  constructor(start, end, step) {
    if (step === 0) {
      throw new RuntimeError("Step size cannot be zero");
    }

    checkNumeric(start);
    checkNumeric(end);
    checkNumeric(step);

    this.start = start;
    this.end = end;
    this.step = step;
    this.type = "range";
  }

  [Symbol.iterator]() {
    const start = this.start;
    const end = this.end;
    const step = this.step;
    let ascending = start < end;
    let i = this.start;

    return {
      next() {
        let value;

        if (ascending && i < end) {
          val = i;
          i++;
        } else if (!ascending && i > end) {
          val = i;
          i--;
        } else {
          return { done: true };
        }

        return { value, done: false };
      },
    };
  }

  toString() {
    return `Range(${this.start}:${this.end}:${this.step})`;
  }
}
