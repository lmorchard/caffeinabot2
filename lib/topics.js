module.exports = () => ({
  topics: {},
  matches: {},

  emit(name, ...args) {
    this.topic(name).emit(...args);
  },

  on(name, cb) {
    return this.topic(name).on(cb);
  },

  emitMatch(name, ...args) {
    for (let { re, listeners } of Object.values(this.matches)) {
      if (re.test(name)) {
        for (let i of listeners) {
          i(name, ...args);
        }
      }
    }
  },

  onMatch(pattern, cb) {
    if (!this.matches[pattern]) {
      this.matches[pattern] = {
        re: new RegExp(pattern),
        listeners: [],
      };
    }
    this.matches[pattern].listeners.push(cb);
    return () =>
      (this.matches[pattern].listeners = this.matches[
        pattern
      ].listeners.filter((i) => i !== cb));
  },

  topic(name) {
    const manager = this;
    if (!this.topics[name]) {
      this.topics[name] = {
        listeners: [],
        emit(...args) {
          for (let i of this.listeners || []) {
            i(...args);
          }
          manager.emitMatch(name, ...args);
        },
        on(cb) {
          (this.listeners = this.listeners || []).push(cb);
          return () =>
            (this.listeners = this.listeners.filter((i) => i !== cb));
        },
      };
    }
    return this.topics[name];
  },
});
