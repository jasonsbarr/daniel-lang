import hash from "object-hash";
import { getType } from "../../lib/js/base.js";
import { RuntimeError, TyError, ValError } from "../../lib/js/error.js";
import { Environment } from "./environment.js";
import { isTruthy, isIterable } from "./utils.js";
import { makeFunction } from "../runtime.js";
import { evalModule, evalProvide, evalOpen, evalImport } from "./module.js";
import { evalClass } from "./class.js";

let ID = 0;
let EXN_STACK = [];
let modPushed = false;

/**
 *
 * @param {Object|Object[]} ast
 * @param {Environment} env
 * @param {String} module
 */
export const evaluateAndGetEnv = async (ast, env, module) => {
  evaluate(ast, env, module);
  return env;
};

const primitives = [
  "ListPattern",
  "HashPattern",
  "Symbol",
  "Number",
  "String",
  "Boolean",
  "Nil",
  "Keyword",
];

const forms = [
  "begin",
  "begin-module",
  "provide",
  "open",
  "class",
  "if",
  "for",
  "for/list",
  "define",
  "set!",
  "let",
  "lambda",
  "quote",
  "quasiquote",
  "eval",
  "defmacro",
];

const isJSPrim = (ast) =>
  ast === null || (typeof ast !== "object" && typeof ast !== "function");

/**
 *
 * @param {Object|Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
export const evaluate = async (ast, env, module = "<main>") => {
  if (!modPushed) {
    EXN_STACK.push(env);
    modPushed = true;
  }

  ast = await macroexpand(ast, env, module);

  if (Array.isArray(ast)) {
    const fst = ast[0];

    // Make sure the list is actually a form, and not an already-evaluated list
    // On the off chance someone defines an object with a type attr of, e.g. "String",
    // and a non-empty syntax attr, this will fail. The likelihood of that seems remote.
    // An empty list will still fall through and be returned as null from evalList
    if (
      isJSPrim(fst) ||
      (fst &&
        !primitives.includes(fst.type) &&
        !fst.syntax &&
        !Array.isArray(fst))
    ) {
      return ast;
    }

    return await evalList(ast, env, module);
  }

  if (isJSPrim(ast)) {
    return ast;
  }

  if (ast && !primitives.includes(ast.type)) {
    // is already evaluated
    return ast;
  }

  switch (ast.type) {
    case "ListPattern":
      return await evalListLiteral(ast, env, module);

    case "HashPattern":
      return await evalHashLiteral(ast, env, module);

    case "Symbol":
      return await evalSymbol(ast, env, module);

    case "Number":
    case "String":
    case "Boolean":
    case "Nil":
    case "Keyword":
      return ast.value;

    default:
      throw new RuntimeError(
        `Unknown expression type ${ast.type} at ${ast.file} ${
          ast.syntax && `${ast.syntax.line}:${ast.syntax.col}`
        }`
      );
  }
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
const evalList = async (ast, env, module) => {
  if (ast.length === 0) {
    return null;
  }
  const fst = ast[0];

  switch (fst.value.description) {
    case "begin":
      return await evalBlock(ast.slice(1), env, module);

    case "begin-module":
      return await evalModule(ast[0], env, evaluate);

    case "provide":
      return await evalProvide(ast, env, module, evaluate);

    case "open":
      return await evalOpen(ast, env, module, evaluate);

    case "import":
      return await evalImport(ast, env, module, evaluate);

    case "class":
      return await evalClass(ast, env, module, evaluate, assign);

    case "if":
      return await evalIf(ast, env, module);

    case "for":
      return await evalFor(ast, env, module);

    case "for/list":
      return await evalForList(ast, env, module);

    case "define":
      return await evalDefine(ast, env, module);

    case "set!":
      return await evalSet(ast, env, module);

    case "let":
      return await evalLet(ast, env, module);

    case "lambda":
      return await evalLambda(ast, env, module);

    case "quote":
      return await quote(ast[1], env, module);

    case "quasiquote":
      return await quasiquote(ast[1], env, module);

    case "eval":
      return await evalEval(ast[1], env, module);

    case "defmacro":
      return await evalDefMacro(ast, env, module);

    default:
      return await evalCall(ast, env, module);
  }
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
const evalBlock = async (ast, env, module) => {
  let value;

  for (let exp of ast) {
    value = await evaluate(exp, env, module);
  }

  return value;
};

/**
 * Unpack a list into function arguments or another list
 * @param {Object|Object[]} list
 * @param {Environment} env
 * @param {String} module
 */
const unpackList = async (list, env, module) => {
  let items;

  if (Array.isArray(list)) {
    // is a call or other list expression
    items = evalList(list, en, module);
  } else if (list.type === "ListPattern") {
    items = list.values.map(async (i) => await evaluate(i, env, module));
  } else if (list.type === "Symbol") {
    items = await evaluate(list, env, module);
  } else {
    throw new RuntimeError("Argument to unpack must be a list");
  }

  return items;
};

/**
 *
 * @param {Object[]} ast
 * @param {Environment} env
 * @param {String} module
 * @returns
 */
const evalCall = async (ast, env, module) => {
  if (ast[0] === undefined) {
    return null;
  }

  let fst = ast[0];

  if (fst.type === "Symbol" && fst.value.description.startsWith(".")) {
    // is object accessor
    const obj = await evaluate(ast[1], env, module);
    const name =
      typeof fst.value === "symbol"
        ? fst.value.description.slice(1) // remove dot
        : fst.value.slice(1);
    const member = obj[name];
    const memberName = name;

    if (member === undefined) {
      throw new RuntimeError(`Undefined member ${name}`);
    }

    if (typeof member === "function") {
      const args = ast.slice(1); // have to get this as an arg
      const params = [];

      for (let arg of args) {
        params.push(await evaluate(arg, env, module));
      }

      return obj[memberName](...params);
    }

    // otherwise it's an object property
    if (ast.slice(1).length === 2) {
      // set attribute value
      const value = await evaluate(ast[2], env, module);
      obj[memberName] = value;
      return value;
    }
    // otherwise it's a getter
    return member;
  }

  // else is call expression
  fst = await evaluate(ast[0], env, module);

  if (typeof fst !== "function") {
    throw new RuntimeError(
      `Expected a function that can be applied to arguments; got ${typeof fst}`
    );
  }

  const isMacroCall = fst.isMacro;
  const args = [];
  let unpack = false;

  for (let arg of ast.slice(1)) {
    if (arg.type === "Amp") {
      unpack = true;
      continue;
    }

    if (unpack === true) {
      args.push(...(await unpackList(arg, env, module)));
      unpack = false;
    } else {
      args.push(await evaluate(arg, env, module));
    }
  }

  if (isMacroCall) {
    return await evalEval(fst.call(null, ...args), env, module);
  }

  return fst.call(null, ...args);
};

const evalSymbol = async (ast, env, module) => {
  const name =
    typeof ast === "symbol" ? ast.description : ast.value.description;
  const val = env.get(name);
  return val;
};

const evalIf = async (ast, env, module) => {
  if (ast.length !== 4) {
    throw new RuntimeError("If expression must have exactly 3 subexpressions");
  }

  const cond = ast[1];
  const then = ast[2];
  const els = ast[3];

  if (isTruthy(await evaluate(cond, env, module))) {
    return await evaluate(then, env, module);
  }

  return await evaluate(els, env, module);
};

/**
 * Evaluate a for-expression (iteration)
 *
 * syntax: for -> (for (clause) (body))
 * clause -> id sequence
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalFor = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("For expression must have exactly 2 subexpressions");
  }

  // clause = [id sequence]
  const clause = ast[1];
  const body = ast[2];
  let value;

  // for now, we'll just do iteration over a single sequence
  // later we may allow multiple clauses
  let [id, seq] = clause[0];
  let when;
  let unless;

  if (clause.length === 3) {
    let kw = await evaluate(clause[1], env, module);
    if (kw === Symbol.for(":when")) {
      when = clause[2];
    } else if (kw === Symbol.for(":unless")) {
      unless = clause[2];
    }
  }

  seq = await evaluate(seq, env, module);

  for (let item of seq) {
    let newEnv = env.extend(`forExpr${ID++}`, module, id.file);

    await assign([id, item], newEnv, module);

    if (when) {
      let test = await evaluate(when, newEnv, module);
      if (isTruthy(test)) {
        value = await evaluate(body, newEnv, module);
      }
    } else if (unless) {
      let test = await evaluate(unless, newEnv, module);
      if (!isTruthy(test)) {
        value = await evaluate(body, newEnv, module);
      }
    } else {
      value = await evaluate(body, newEnv, module);
    }
  }

  return value;
};

/**
 * List comprehension
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalForList = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError(
      "List comprehension must have exactly 2 subexpressions"
    );
  }

  const clause = ast[1];
  const body = ast[2];
  let list = [];
  let [id, seq] = clause[0];
  let when;
  let unless;

  if (clause.length === 3) {
    let kw = await evaluate(clause[1], env, module);
    if (kw === Symbol.for(":when")) {
      when = clause[2];
    } else if (kw === Symbol.for(":unless")) {
      unless = clause[2];
    }
  }
  seq = await evaluate(seq, env, module);

  if (isIterable(seq)) {
    for (let item of seq) {
      let newEnv = env.extend(`for/listExpr${ID++}`, id.file);

      await assign([id, item], newEnv);

      if (when) {
        let test = await evaluate(when, newEnv, module);
        if (isTruthy(test)) {
          list.push(await evaluate(body, newEnv, module));
        }
      } else if (unless) {
        let test = await evaluate(unless, newEnv, module);
        if (!isTruthy(test)) {
          list.push(await evaluate(body, newEnv, module));
        }
      } else {
        list.push(await evaluate(body, newEnv, module));
      }
    }
  } else {
    throw new TyError("iterable", getType(seq));
  }

  return list;
};

/**
 * Destructure a list into variable assignments
 * @param {Array*} left
 * @param {Array} right
 * @param {Environment} env
 * @param {String} module
 */
const destructureList = (left, right, env, module, define) => {
  const names = left.value;
  const exprs = right.value ?? right; // in case it's an already-evaluated list

  if (names.length > exprs.length) {
    throw new RuntimeError(
      `${names.length} identifiers but only ${exprs.length} values to unpack`
    );
  }

  let i = 0;
  let value;
  let values = [];
  let rest = false;
  for (let name of names) {
    if (name.value === "&") {
      rest = true;
      continue;
    }

    if (rest) {
      if (names.slice(i + 1).length > 1) {
        throw new RuntimeError(
          "Can only have a single identifier after rest symbol"
        );
      }
      return assign([name, exprs.slice(i)], env, module, define, true);
    }

    value = assign([name, exprs[i]], env, module, define);
    values.push(value);
    i++;
  }

  // return the last value
  return values;
};

/**
 * Destructure an object, struct, or map into variable assignments
 * @param {Object} left
 * @param {Object|Array} right
 * @param {Environment} env
 * @param {String} module
 */
const destructureObject = async (left, right, env, module, define) => {
  const names = left.value;
  const exprs = right; // if not evaluated, is a hash pattern or identifier token that resolves to a hash
  const exprLength = exprs.length ?? exprs.size ?? Object.keys(exprs).length;
  let value;
  let values = [];

  if (names.length > exprLength) {
    throw new RuntimeError(
      `${names.length} identifiers but only ${exprs.length} values to unpack`
    );
  }

  const obj = await evaluate(right, env, module);

  for (let name of names) {
    // handle assignment in case of Map or struct/object
    // Map
    if (obj instanceof Map) {
      if (obj.has(name.value)) {
        value = assign([name, obj.get(name.value)], env, module, define);
      } else if (obj.has(Symbol.for(`:${name.value}`))) {
        value = assign(
          [name, obj.get(Symbol.for(`:${name.value}`))],
          env,
          module,
          define
        );
      } else {
        throw new RuntimeError(
          `Key ${name.value} not found in hash. Destructuring must use string or keyword keys that exist in the hash.`
        );
      }
    }
    // handle struct/object case
    values.push(value);
  }

  // return last value
  return values;
};

/**
 * Bind a value to a name
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @param {Boolean} def
 * @param {Boolean} rest
 */
const assign = async (
  ast,
  env,
  module,
  def = true,
  rest = false,
  setScope = null
) => {
  const [id, expr] = ast;

  if (!setScope) {
    setScope = env;
  }

  if (id.type === "ListPattern") {
    return destructureList(id, expr, env, module, def);
  }

  if (id.type === "HashPattern") {
    return destructureObject(id, expr, env, module, def);
  }

  const name = typeof id.value === "symbol" ? id.value.description : id.value;

  if (def && env.inCurrent(name)) {
    throw new ValError(`Name ${name} has already been defined in this scope`);
  }

  if (Array.isArray(expr) && rest) {
    // rest identifier present in destructuring list
    let list = [];
    for (let ex of expr) {
      list.push(await evaluate(ex, env, module));
    }

    setScope.set(name, list);
    return list;
  }

  const value = await evaluate(expr, env, module);
  setScope.set(name, value);
  return value;
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalDefine = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Define must have exactly 2 subexpressions");
  }

  const id = ast[1];
  const expr = ast[2];

  if (Array.isArray(id)) {
    // is function definition
    const name = id[0];
    const args = id.slice(1);
    const func = await makeLambda(name.value, [args, expr], env, module);
    return await assign([name, func], env, module);
  }

  return await assign([id, expr], env, module);
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalSet = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Set must have exactly 2 subexpressions");
  }

  const id = ast[1];
  const name = id.value.description;
  const scope = env.lookup(name);

  if (scope) {
    return assign(ast.slice(1), env, module, false, false, scope);
  } else {
    throw new RuntimeError(`${name} is not bound in the current scope`);
  }
};

/**
 * Evaluate a let expression
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalLet = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError("Let must have exactly 2 subexpressions");
  }

  const defns = ast[1];
  const body = ast[2];
  const newEnv = env.extend(`letExpr${ID++}`, module, defns[0][0].file);

  for (let defn of defns) {
    await assign(defn, newEnv, module);
  }

  return evaluate(body, newEnv, module);
};

/**
 * Evaluate a lambda expression to create a function
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @returns {Function}
 */
const evalLambda = async (ast, env, module) => {
  if (ast.length !== 3) {
    throw new RuntimeError(
      "Lambda expression must have exactly 2 subexpressions"
    );
  }

  const name = `lambda${ID++}`;
  return await makeLambda(name, ast.slice(1), env, module);
};

/**
 * Create function object
 * @param {String} name
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 * @returns {Function}
 */
const makeLambda = async (name, ast, env, module) => {
  const params = ast[0].map((t) => t.value);
  const body = ast[1];
  let varargs = params.includes("&");
  let arity = params.length;
  name = typeof name === "symbol" ? name.description : name;

  if (varargs) {
    arity -= 2;
  }

  const lambda = async (...args) => {
    const scope = env.extend(name, module, body[0] ? body[0].file : body.file);
    EXN_STACK.push(scope); // add activation record to stack

    if (params && params.length) {
      let i = 0;
      for (let param of params) {
        if (param === "&") {
          varargs = true;
          continue;
        }

        if (!varargs) {
          scope.set(param.description, args[i]);
        } else if (varargs) {
          scope.set(param.description, args.slice(i));
        }
        i++;
      }
    }

    const value = await evaluate(body, scope, module);
    EXN_STACK.pop(); // remove activation record from stack
    return value;
  };
  return makeFunction(lambda, module, { name, arity, varargs });
};

/**
 *
 * @param {Object} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalListLiteral = async (ast, env, module) => {
  let list = [];
  let unpack = false;

  for (let val of ast.value) {
    if (val.type === "Amp") {
      unpack = true;
      continue;
    }

    if (unpack === true) {
      list.push(...(await unpackList(val, env, module)));
      unpack = false;
    } else {
      list.push(await evaluate(val, env, module));
    }
  }

  return list;
};

/**
 *
 * @param {Object} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalHashLiteral = async (ast, env, module) => {
  // check if it's a :with expression
  // syntax {obj :with k v k2 v2 ...}
  if (
    ast.value[1].type === "Keyword" &&
    ast.value[1].value === Symbol.for(":with")
  ) {
    let args = ast.value.slice(2);

    if (args.length % 2 !== 0) {
      throw new RuntimeError(
        `A :with expression must take a series of key/value pairs`
      );
    }

    let obj = await evaluate(ast.value[0], env, module);
    let entries = Object.entries(obj);

    for (let i = 0; i < args.length; i += 2) {
      let k = await evaluate(args[i], env, module);
      let v = await evaluate(args[i + 1], env, module);
      entries.push([k, v]);
    }

    let m = new Map(entries);

    return obj.constructor(m);
  }

  // otherwise it's a hash literal expression
  if (ast.value.length % 2 !== 0) {
    throw new RuntimeError(
      "A hash literal must contain an even number of values as a series of key/value pairs"
    );
  }

  let hash = new Map();
  const values = ast.value;

  for (let i = 0; i < values.length; i += 2) {
    let key = await evaluate(values[i], env, module);
    let val = await evaluate(values[i + 1], env, module);

    if (typeof key === "object" && key !== null) {
      key = hash(key);
    }

    hash.set(key, val);
  }

  return hash;
};

const quoteVal = (val) => {
  if (Array.isArray(val)) {
    const result = val.map((v) => quoteVal(v));
    return result.length ? result : null;
  } else if (val.type === "ListPattern") {
    return val.value.map(quoteVal);
  } else if (val.type === "HashPattern") {
    if (val.value.length % 2 !== 0) {
      throw new RuntimeError(
        "Hash literal must contain a series of key/value pairs"
      );
    }
    const value = val.value.map(quoteVal);
    let entries = [];

    for (let i = 0; i < value.length; i += 2) {
      let k = value[i];
      let v = value[i + 1];
      entries.push([k, v]);
    }

    return new Map(entries);
  }
  return val.value;
};

/**
 * Quote the data in a form instead of evaluating it directly
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const quote = (ast, env, module) => {
  return quoteVal(ast);
};

const quasiquote = async (ast, env, module) => {
  if (Array.isArray(ast)) {
    if (ast.length === 2 && ast[0].value === Symbol.for("unquote")) {
      return await evaluate(ast[1], env, module);
    } else {
      let spliceTrue = ast[0] && ast[0].value === Symbol.for("splice-unquote");
      let elt = spliceTrue ? ast : ast[0];
      let result = [];

      if (
        Array.isArray(elt) &&
        elt.length === 2 &&
        elt[0].value === Symbol.for("splice-unquote")
      ) {
        result = result.concat(await evaluate(elt[1], env, module));
        if (!spliceTrue) {
          for (let el of ast.slice(1)) {
            result = result.concat(await quasiquote(el, env, module));
          }
        }
      } else if (ast.length) {
        for (let el of ast) {
          result = result.concat(await quasiquote(el, env, module));
        }
        return result;
      }

      return result;
    }
  }

  return quote(ast);
};

const expandAst = (ast) => {
  const expandSymbol = (sym) => {
    if (typeof sym === "symbol") {
      return { type: "Symbol", value: sym };
    }

    return sym;
  };

  const expandArray = (node) => {
    return node.map((n) => {
      if (Array.isArray(n)) {
        return expandArray(n);
      }
      return expandSymbol(n);
    });
  };

  if (Array.isArray(ast)) {
    ast = expandArray(ast);
  } else {
    ast = expandSymbol(ast);
  }

  return ast;
};

const evalEval = async (ast, env, module) => {
  // First, get all the symbol values
  ast = await evaluate(ast, env, module);

  // Then evaluate the expanded symbols
  return await evaluate(expandAst(ast), env, module);
};

/**
 * Define a new binding in the current environment
 * @param {Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const evalDefMacro = async (ast, env, module) => {
  const name = ast[1];
  const args = ast[2];
  const expr = ast[3];
  const func = await makeLambda(
    typeof name.value === "symbol" ? name.value.description : name.value,
    [args, expr],
    env,
    module
  );
  func.isMacro = true;
  return await assign([name, func], env, module);
};

/**
 * Expand any macros called in ast
 * @param {Object|Array} ast
 * @param {Environment} env
 * @param {String} module
 */
const macroexpand = async (ast, env, module) => {
  if (Array.isArray(ast)) {
    if (ast && ast[0] === undefined) {
      return ast;
    }

    if (ast && ast[0].value && forms.includes(ast[0].value.description)) {
      return ast;
    }

    if (ast) {
      let fst = evaluate(ast[0], env, module);

      if (fst.isMacro) {
        ast = await evalCall(ast, env, module);
        ast = expandAst(ast);
      }
    }
  }
  return ast;
};
