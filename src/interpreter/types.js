import { RuntimeError, TyError, OutOfRangeError } from "../../lib/js/error.js";
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
    this.length = Math.abs(end - start);
  }

  get(i) {
    if (this.start < this.end) {
      if (this.step * i + this.start < this.end) {
        return this.step * i + this.start;
      }
    } else if (this.end < this.start) {
      if (this.start - this.step * i > this.end) {
        return this.start - this.step * i;
      }
    }

    throw new OutOfRangeError(i);
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
          value = i;
        } else if (!ascending && i > end) {
          value = i;
        } else {
          return { done: true };
        }

        i += step;
        return { value, done: false };
      },
    };
  }

  toString() {
    return `Range(${this.start}:${this.end}:${this.step})`;
  }
}
