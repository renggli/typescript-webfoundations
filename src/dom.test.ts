import { describe, expect, test } from "vitest";
import { createElement } from "./dom.ts";

describe("createElement", () => {
  test("as simple as it gets", () => {
    const element = createElement("div");
    expect(element.outerHTML).toBe("<div></div>");
  });
  test("with a singe attribute", () => {
    const element = createElement("p", { class: "foo" });
    expect(element.outerHTML).toBe('<p class="foo"></p>');
  });
  test("with multiple attributes", () => {
    const element = createElement("span", { class: "foo", id: "bar" });
    expect(element.outerHTML).toBe('<span class="foo" id="bar"></span>');
  });
  test("with a single text child", () => {
    const element = createElement("div", "Hello World");
    expect(element.outerHTML).toBe("<div>Hello World</div>");
  });
  test("with multiple children", () => {
    const element = createElement("div", "Hello", " ", "World");
    expect(element.outerHTML).toBe("<div>Hello World</div>");
  });
  test("with an attribute and child", () => {
    const element = createElement("div", { id: "foo" }, "bar");
    expect(element.outerHTML).toBe('<div id="foo">bar</div>');
  });
  test("with nested elements", () => {
    const element = createElement(
      "div",
      { id: "head" },
      createElement("h1", "Title"),
      createElement("p", "Content")
    );
    expect(element.outerHTML).toBe(
      '<div id="head"><h1>Title</h1><p>Content</p></div>'
    );
  });
});
