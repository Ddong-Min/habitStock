module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: ["/lib/**/*"],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    quotes: ["error", "double"],
    "import/no-unresolved": 0,
    "quote-props": "off",
    "object-curly-spacing": "off",
    "max-len": "off",
    "require-jsdoc": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_|event" },
    ],
    "@typescript-eslint/no-non-null-assertion": "off",
    "operator-linebreak": "off",
    "no-trailing-spaces": "off",
    "spaced-comment": "off",
    "valid-jsdoc": "off",
    "linebreak-style": ["error", "windows"], // Change "unix" to "windows" or add this line
    "@typescript-eslint/no-explicit-any": "off",
    indent: "off",
  },
};
