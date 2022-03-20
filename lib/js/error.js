export class RuntimeError extends Error {
  constructor(msg) {
    super(msg);
  }

  toString() {
    return String(this.stack ? this.stack : this.message);
  }
}

export class RefError extends RuntimeError {
  /**
   * Error for when name is accessed without being initialized in the current scope
   * @param {String} name
   */
  constructor(name) {
    super(`ReferenceError: ${name} is not defined`);
    this.name = "ReferenceError";
  }
}
