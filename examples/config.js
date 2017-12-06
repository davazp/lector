const { ask, coroutine } = require("lector");

// Basic context
const config = ask.prop("config");

// Abstract selectors out of the general context
const userPreferences = config.chain(c => {
  return Object.assign({ language: "en" }, c);
});

const userLanguage = userPreferences.prop("language");

// You can also create functions with arguments
const translate = key => {
  const i18n = {
    en: { hello: "hello", bye: "bye" },
    es: { hello: "hola", bye: "adios" }
  };
  return userLanguage.chain(lang => i18n[lang][key]);
};

const main = coroutine(function*() {
  console.log(yield translate("hello"), "!");
  console.log(yield translate("bye"), "!");
});

// User your functions by providing the context once

const _context1 = {
  // No language set, should use the default
};
const _context2 = {
  config: { language: "es" }
};

const test = () => {
  main().run(_context1);
  main().run(_context2);
};

test();
