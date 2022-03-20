import { RefError } from "../../lib/js/error.js";

export class Environment {
  constructor(parent, module, name) {
    this.parent = parent;
    this.module = module;
    this.name = name;
    this.namespace = Object.create(null);
    this.children = [];
  }

  /**
   * Create a new env with the current one as its parent
   * @param {String} name Name for the new env
   */
  extend(name) {
    const env = createEnv(this, { module: this.module, name });
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
    // doing this instead of name in this.namespace so I can use it
    // later to check for lexical scope violations
    return this.namespace[name] !== undefined;
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
    return `Environment(module=${this.module}-${this.name})`;
  }
}

export const createEnv = (
  parent = null,
  { module = "<global>", name = "global" } = {}
) => new Environment(parent, module, name);