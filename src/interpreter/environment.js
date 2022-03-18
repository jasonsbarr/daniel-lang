const { RefError } = require("../../lib/js/error");

class Environment {
  constructor(parent, module, name) {
    this.parent = parent;
    this.module = module;
    this.name = name;
    this.namespace = Object.create(null);
  }

  /**
   * Create a new env with the current one as its parent
   * @param {String} name Name for the new env
   */
  extend(name) {
    return createEnv(this, { name });
  }

  /**
   * Get the value for {name} from the current env or one of its parents
   * @param {Symbol} name Binding name to look up
   * @returns {Any}
   */
  get(name) {}

  /**
   * Check if {name} exists in the current env or one of its parents
   * @param {Symbol} name
   */
  lookup(name) {}

  /**
   * Bind a value to a name in the current environment
   * @param {Symbol} name
   * @param {Any} value
   */
  set(name, value) {}

  toString() {
    return `Environment(module=${this.module}.${this.name})`;
  }
}

const createEnv = (
  parent = null,
  { module = "<main>", name = "global" } = {}
) => new Environment(parent, module, name);

module.exports = {
  Environment,
  createEnv,
};
