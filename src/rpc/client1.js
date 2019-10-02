module.exports = {
  getDate: () => new Date().toISOString(),
  add: (a, b) => a + b,
  box: text => `<<${text}>>`,
};
