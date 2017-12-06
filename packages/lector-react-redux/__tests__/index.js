import React from "react";
import ReactDOMServer from "react-dom/server";

import { createStore } from "redux";
import { Provider } from "react-redux";

import Reader from "lector";
import { getState } from "lector-redux";
import { connectReaders } from "../lib";

// Render Component within a Provider with a specific store and return
// the rendered static markup.
function renderTest(store, Component) {
  const element = React.createElement(
    Provider,
    { store },
    React.createElement(Component, {})
  );
  return ReactDOMServer.renderToStaticMarkup(element);
}

test("connectReaders returns a function", () => {
  expect(connectReaders({})).toBeInstanceOf(Function);
});

test("connectReaders won't change literal objects", () => {
  const store = createStore(x => x, {});

  const enhance = connectReaders({ x: 10, y: 20 });
  const Component = enhance(({ x }) => {
    return React.createElement("span", {}, x);
  });

  const html = renderTest(store, Component);

  expect(html).toBe("<span>10</span>");
});

test("can call a function creating reader", () => {
  const store = createStore(x => x, {});

  const f = () => Reader.of(5);

  const enhance = connectReaders({ f });
  const Component = enhance(({ f }) => {
    return React.createElement("span", {}, f());
  });

  const html = renderTest(store, Component);

  expect(html).toBe("<span>5</span>");
});

test("connected readers can access the state", () => {
  const store = createStore(x => x, { x: 10 });

  const f = () => getState.prop("x");

  const enhance = connectReaders({ f });
  const Component = enhance(({ f }) => {
    return React.createElement("span", {}, f());
  });

  const html = renderTest(store, Component);

  expect(html).toBe("<span>10</span>");
});
