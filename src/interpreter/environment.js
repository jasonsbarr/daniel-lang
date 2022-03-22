import { RefError } from "../../lib/js/error.js";

export class Environment {
  constructor(parent, module, name, file = "<stdin>") {
    this.parent = parent;
    this.module = module;
    this.name = name;
    this.file = file;
    this.namespace = Object.create(null);
    this.children = [];
    this.set("<module>", module);
    this.set("<file>", file);

    Object.defineProperty(this, "<module>", {
      configurable: false,
      writable: false,
      enumerable: false,
    });

    Object.defineProperty(this, "<file>", {
      configurable: false,
      enumerable: false,
    });
  }

  /**
   *
   * @param {Module} module
   */
  bindModuleNames(module) {
    for (let [k, v] of Object.entries(module.provides)) {
      this.set(k, v);
    }
  }

  /**
   * Create a new env with the current one as its parent
   * @param {String} name Name for the new env
   */
  extend(name, module = this.module, file = "<stdin>") {
    const env = createEnv({ parent: this, module, name, file });
    this.children.push(env);
    return env;
  }

  /**
   * Get the value for {name} from the current env or one of its parents
   * @param {String} name Binding name to look up
   * @returns {Any}
   */
  get(name) {
    const scope = this.lookup(name);
    return scope.namespace[name];
  }

  /**
   * See if a name is already bound in the current Environment
   * @param {String} name
   * @returns {Boolean}
   */
  inCurrent(name) {
    return name in this.namespace;
  }

  /**
   * Check if {name} exists in the current env or one of its parents
   * @param {String} name
   */
  lookup(name) {
    let scope = this;

    while (scope) {
      if (scope.namespace[name] !== undefined) {
        return scope;
      }

      scope = scope.parent;
    }

    throw new RefError(name);
  }

  /**
   * Bind a value to a name in the current environment
   * @param {String} name
   * @param {Any} value
   */
  set(name, value) {
    this.namespace[name] = value;
  }

  toString() {
    return `Environment(module=${this.module}.${this.name})`;
  }
}

export const createEnv = ({
  parent = null,
  module = "<global>",
  name = "<global>",
  file = "<stdin>",
} = {}) => new Environment(parent, module, name, file);
