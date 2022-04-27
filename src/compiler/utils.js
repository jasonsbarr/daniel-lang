export const isKeyword = (value) =>
  typeof value === "symbol" && Symbol.keyFor(value).startsWith(":");
