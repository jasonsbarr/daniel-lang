class SymbolTable {
  constructor(parent = null) {
    this.parent = parent;
    this.namespace = Object.create(null);
  }

  get(sym) {
    const scope = this.lookup(sym);
    return scope.namespace[sym];
  }

  lookup(sym) {
    if (sym in this.namespace) {
      return this;
    }

    let scope = this.parent;

    while (scope !== null) {
      if (sym in scope.namespace) {
        return scope;
      }

      scope = scope.parent;
    }

    throw new Error(`Symbol ${Symbol.keyFor(sym)} not found in scope`);
  }

  set(sym, val) {
    this.namespace[sym] = val;
  }
}
