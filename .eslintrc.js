module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2017
  },
  "extends": "eslint:recommended",
  rules: {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
};