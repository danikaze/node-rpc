const implementation = {
  getDate: () => new Date().toISOString(),
  add: (a, b) => a + b,
  box: text => `<{[${text}]}>`,
};

__non_webpack_module__.exports = implementation;
