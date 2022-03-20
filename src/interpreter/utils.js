import { isNil } from "../utils.js";

export const isTruthy = (obj) =>
  !(obj === false || obj === null || obj === undefined);

export const isIterable = (obj) => {
  if (isNil(obj)) return false;

  return typeof obj[Symbol.iterator] === "function";
};
