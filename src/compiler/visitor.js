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

    switch (ast.type) {
      case "Symbol":
      case "Keyword": {
        if (isKeyword(ast.value)) {
          return this.visitKeyword(ast, ...args);
        }
        return this.visitSymbol(ast, ...args);
      }

      case "Number":
        return this.visitNumber(ast, ...args);

      case "String":
        return this.visitString(ast, ...args);

      case "Boolean":
        return this.visitBoolean(ast, ...args);

      case "Nil":
        return this.visitNil(ast, ...args);
    }
  }

  visitList(ast, ...args) {
    if (Array.isArray(ast) && ast.length === 0) {
      return ast;
    }

    const [first] = ast;

    if (typeof first.value === "symbol") {
      switch (Symbol.keyFor(first)) {
        case "begin":
          return this.visitBegin(ast, ...args);

        case "begin-module":
          return this.visitModule(ast, ...args);

        case "provide":
          return this.visitProvide(ast, ...args);

        case "open":
          return this.visitOpen(ast, ...args);

        case "import":
          return this.visitImport(ast, ...args);

        case "class":
          return this.visitClass(ast, ...args);

        case "if":
          return this.visitIf(ast, ...args);

        case "for":
          return this.visitFor(ast, ...args);

        case "for/list":
          return this.visitForList(ast, ...args);

        case "define":
          return this.visitDefine(ast, ...args);

        case "set!":
          return this.visitSet(ast, ...args);

        case "let":
          return this.visitLet(ast, ...args);

        case "lambda":
          return this.visitLambda(ast, ...args);

        case "quote":
          return this.visitQuote(ast, ...args);

        case "quasiquote":
          return this.visitQuasiquote(ast, ...args);

        case "defmacro":
          return this.visitDefMacro(ast, ...args);

        case "try":
          return this.visitTryCatch(ast, ...args);

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
    ast.value = ast.value.map((node) => this.visit(node, ...args));
    return ast;
  }

  visitHashPattern(ast, ...args) {
    ast.value = ast.value.map((node) => this.visit(node, ...args));
    return ast;
  }

  visitBegin(ast, ...args) {
    return ast.map((node) => this.visit(node, ...args));
  }

  visitCall(ast, ...args) {
    return ast.map((node) => this.visit(node, ...args));
  }

  visitModule(ast, ...args) {}

  visitProvide(ast, ...args) {}

  visitOpen(ast, ...args) {}

  visitImport(ast, ...args) {}

  visitClass(ast, ...args) {}

  visitIf(ast, ...args) {}

  visitFor(ast, ...args) {}

  visitForList(ast, ...args) {}

  visitDefine(ast, ...args) {}

  visitSet(ast, ...args) {}

  visitLet(ast, ...args) {}

  visitLambda(ast, ...args) {}

  visitQuote(ast, ...args) {}

  visitQuasiquote(ast, ...args) {}

  visitEval(ast, ...args) {}

  visitDefMacro(ast, ...args) {}

  visitTryCatch(ast, ...args) {}
}
