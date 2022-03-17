import { curry } from "@jasonsbarr/functional-core";

/**
 * Convert a JS function into a Daniel function object
 *
 * Daniel functions are autocurried
 * @param {Function} func
 * @param {String} name
 * @param {Number} arity
 */
export const makeFunction = (func, name, arity) => {
  name = name ?? (func.name || "<lambda>");
  arity = arity ?? func.length;
  func = curry(func);
  func.name = name;
  func.arity = arity;
  return func;
};
