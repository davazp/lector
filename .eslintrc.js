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
  "plugins": [
    "prettier"
  ],
  "extends": ["eslint:recommended", "prettier"],
  rules: {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prettier/prettier": "error"
  }
};
