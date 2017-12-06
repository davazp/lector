module.exports = {
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: ["packages/**/*.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
  // NOTE: As of 20171205, this seems necessary or jest will find
  // duplicated package lector, both in packages/ as the toplevel
  // one. This seems a bug, as the main package has actually no name.
  modulePathIgnorePatterns: ["<rootDir>/package.json"]
};
