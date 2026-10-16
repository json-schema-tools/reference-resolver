module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: require('path').join(__dirname, 'coverage'),
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: { global: { branches: 88.88, functions: 96, lines: 96.55, statements: 97.24 } },
  resetMocks: true,
  restoreMocks: true,
  rootDir: './src',
  preset: 'ts-jest'
};
