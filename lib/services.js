const createServiceHub = () => ({
  services: {},
  call(service, ...args) {
    if (service in this.services) {
      return this.services[service][0](...args);
    }
  },
  callAll(service, ...args) {
    if (service in this.services) {
      return Promise.all(this.services[service].map((i) => i(...args)));
    }
  },
  provide(service, cb) {
    (this.services[service] = this.services[service] || []).push(cb);
    return () =>
      (this.services[service] = this.services[service].filter((i) => i !== cb));
  },
});

module.exports = { createServiceHub };
