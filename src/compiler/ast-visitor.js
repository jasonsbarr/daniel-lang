import { isKeyword } from "./utils.js";

export class Visitor {
  constructor() {
    if (this.constructor.name === "Visitor") {
      throw new Error(
        "Cannot instantiate abstract base class Visitor directly"
      );
    }
  }

  visit(ast, ...args) {
    if (Array.isArray) {
      return this.visitList(ast, ...args);
    }

    if (ast.type === "ListPattern") {
      return this.visitListPattern(ast, ...args);
    }

    if (ast.type === "HashPattern") {
      return this.visitHashPattern(ast, ...args);
    }

    switch (typeof ast) {
      case "symbol":
        if (isKeyword(ast)) {
          return this.visitKeyword(ast, ...args);
        }
        return this.visitSymbol(ast, ...args);

      case "number":
        return this.visitNumber(ast, ...args);

      case "string":
        return this.visitString(ast, ...args);

      case "boolean":
        return this.visitBoolean(ast, ...args);

      case "nil":
        return this.visitNil(ast, ...args);
    }
  }

  visitList(ast, ...args) {
    const [first, ...rest] = ast;

    if (Array.isArray(first)) {
      return first.map((node) => this.visit(node, ...args));
    }

    if (typeof first === "symbol") {
      switch (Symbol.keyFor(first)) {
        case "begin":
          return this.visitBegin(rest, ...args);

        default:
          return;
      }
    }

    throw new Error(`Unknown syntax ${String(first)}`);
  }

  visitBegin(ast, ...args) {}

  visitCall(ast, ...args) {}

  visitSymbol(ast, ...args) {
    return;
  }

  visitNumber(ast, ...args) {
    return;
  }

  visitString(ast, ...args) {
    return;
  }

  visitBoolean(ast, ...args) {
    return;
  }

  visitNil(ast, ...args) {
    return;
  }

  visitKeyword(ast, ...args) {
    return;
  }

  visitListPattern(ast, ...args) {
    return;
  }

  visitHashPattern(ast, ...args) {
    return;
  }
}
