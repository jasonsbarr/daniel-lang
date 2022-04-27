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
    if (Array.isArray(ast)) {
      return this.visitList(ast, ...args);
    }

    if (ast.type === "ListPattern") {
      return this.visitListPattern(ast, ...args);
    }

    if (ast.type === "HashPattern") {
      return this.visitHashPattern(ast, ...args);
    }

    switch (typeof ast) {
      case "symbol": {
        if (isKeyword(ast)) {
          return this.visitKeyword(ast, ...args);
        }
        return this.visitSymbol(ast, ...args);
      }

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
          return this.visitCall(ast, ...args);
      }
    }

    throw new Error(`Unknown syntax ${String(first)}`);
  }

  visitSymbol(ast, ...args) {
    return ast;
  }

  visitNumber(ast, ...args) {
    return ast;
  }

  visitString(ast, ...args) {
    return ast;
  }

  visitBoolean(ast, ...args) {
    return ast;
  }

  visitNil(ast, ...args) {
    return ast;
  }

  visitKeyword(ast, ...args) {
    return ast;
  }

  visitListPattern(ast, ...args) {
    return ast.value.map((node) => this.visit(node, ...args));
  }

  visitHashPattern(ast, ...args) {
    return ast.value.map((node) => this.visit(node, ...args));
  }

  visitBegin(ast, ...args) {
    return ast.map((node) => this.visit(node, ...args));
  }

  visitCall(ast, ...args) {}
}
