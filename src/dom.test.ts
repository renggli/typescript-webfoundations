import { describe, expect, test } from "vitest";
import {
  createVirtual,
  createElement,
  updateElement,
  REGISTERED_LISTENERS,
} from "./dom";

const handler1: EventListener = () => 1;
const handler2: EventListener = (event: Event) => 2;
const handlerObject: EventListenerObject = {
  handleEvent: (event: Event) => 3,
};

function parseHtml(input: string): Element {
  const template = document.createElement("template");
  template.innerHTML = input.trim();
  return template.content.firstChild as Element;
}

function registeredListeners(element: Element) {
  return (element as any)[REGISTERED_LISTENERS];
}

describe("createVirtual", () => {
  test("as simple as it gets", () => {
    const virtual = createVirtual("div");
    expect(virtual).toEqual({
      tagName: "div",
    });
  });
  test("with a singe attribute", () => {
    const virtual = createVirtual("p", { class: "foo" });
    expect(virtual).toEqual({
      tagName: "p",
      attributes: { class: "foo" },
    });
  });
  test("with multiple attributes", () => {
    const virtual = createVirtual("p", { class: "foo", id: "bar" });
    expect(virtual).toEqual({
      tagName: "p",
      attributes: { class: "foo", id: "bar" },
    });
  });
  test("with a single function listener", () => {
    const virtual = createVirtual("p", { onClick: handler1 });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: {
        click: { listener: handler1 },
      },
    });
  });
  test("with a single function listener and options", () => {
    const listener = { listener: handler1, options: { passive: true } };
    const virtual = createVirtual("p", { onClick: listener });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: {
        click: listener,
      },
    });
  });
  test("with a multiple function listeners", () => {
    const virtual = createVirtual("p", {
      onMouseEnter: handler1,
      onMouseLeave: handler2,
    });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: {
        mouseenter: { listener: handler1 },
        mouseleave: { listener: handler2 },
      },
    });
  });
  test("with a handler object", () => {
    const virtual = createVirtual('p', {
      onClick: handlerObject,
    });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: {
        click: { listener: handlerObject },
      }
    });
  });
  test("with a handler object and options", () => {
    const listener = { listener: handlerObject, options: { capture: true } };
    const virtual = createVirtual('p', {
      onClick: listener,
    });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: {
        click: listener,
      }
    });
  });
  test("with a single text child", () => {
    const virtual = createVirtual("div", {}, "Hello World");
    expect(virtual).toEqual({
      tagName: "div",
      children: ["Hello World"],
    });
  });
  test("with multiple children", () => {
    const virtual = createVirtual("div", {}, "Hello", " ", "World");
    expect(virtual).toEqual({
      tagName: "div",
      children: ["Hello", " ", "World"],
    });
  });
  test("with attribute, listener and child", () => {
    const virtual = createVirtual(
      "div",
      { id: "foo", onClick: handler1 },
      "bar"
    );
    expect(virtual).toEqual({
      tagName: "div",
      attributes: { id: "foo" },
      listeners: {
        click: { listener: handler1 }
      },
      children: ["bar"],
    });
  });
  test("with nested elements", () => {
    const virtual = createVirtual(
      "div",
      { id: "head" },
      createVirtual("h1", {}, "Title"),
      createVirtual("p", {}, "Content")
    );
    expect(virtual).toEqual({
      tagName: "div",
      attributes: { id: "head" },
      children: [
        {
          tagName: "h1",
          children: ["Title"],
        },
        {
          tagName: "p",
          children: ["Content"],
        },
      ],
    });
  });
});

describe("createElement", () => {
  test("as simple as it gets", () => {
    const element = createElement({
      tagName: "div",
    });
    expect(element.outerHTML).toEqual("<div></div>");
  });
  test("with a singe attribute", () => {
    const element = createElement({
      tagName: "p",
      attributes: { class: "foo" },
    });
    expect(element.outerHTML).toEqual('<p class="foo"></p>');
  });
  test("with multiple attributes", () => {
    const element = createElement({
      tagName: "p",
      attributes: { class: "foo", id: "bar" },
    });
    expect(element.outerHTML).toEqual('<p class="foo" id="bar"></p>');
  });
  test("with a single function listener", () => {
    const element = createElement({
      tagName: "p",
      listeners: {
        click: { listener: handler1 }
      },
    });
    expect(element.outerHTML).toEqual("<p></p>");
    expect(registeredListeners(element)).toEqual({
      click: { listener: handler1 },
    });
  });
  test("with a single function listener and options", () => {
    const listener = { listener: handler1, options: { passive: true } };
    const element = createElement({
      tagName: "p",
      listeners: {
        click: listener
      },
    });
    expect(element.outerHTML).toEqual("<p></p>");
    expect(registeredListeners(element)).toEqual({
      click: listener,
    });
  });
  test("with a multiple function listeners", () => {
    const element = createElement({
      tagName: "p",
      listeners: {
        mouseenter: { listener: handler1 },
        mouseleave: { listener: handler2 }
      },
    });
    expect(element.outerHTML).toEqual("<p></p>");
    expect(registeredListeners(element)).toEqual({
      mouseenter: { listener: handler1 },
      mouseleave: { listener: handler2 },
    });
  });
  test("with a handler object", () => {
    const element = createElement({
      tagName: "p",
      listeners: {
        click: { listener: handlerObject },
      }
    });
    expect(element.outerHTML).toEqual("<p></p>");
    expect(registeredListeners(element)).toEqual({
      click: { listener: handlerObject },
    });
  });
  test("with a handler object and options", () => {
    const listener = { listener: handlerObject, options: { capture: true } };
    const element = createElement({
      tagName: "p",
      listeners: {
        click: listener,
      }
    });
    expect(element.outerHTML).toEqual("<p></p>");
    expect(registeredListeners(element)).toEqual({
      click: listener,
    });
  });
  test("with a single text child", () => {
    const element = createElement({
      tagName: "div",
      children: ["Hello World"],
    });
    expect(element.outerHTML).toEqual("<div>Hello World</div>");
  });
  test("with multiple children", () => {
    const element = createElement({
      tagName: "div",
      children: ["Hello", " ", "World"],
    });
    expect(element.outerHTML).toEqual("<div>Hello World</div>");
  });
  test("with attribute, listener and child", () => {
    const element = createElement({
      tagName: "div",
      attributes: { id: "foo" },
      listeners: { click: { listener: handler1 } },
      children: ["bar"],
    });
    expect(element.outerHTML).toEqual('<div id="foo">bar</div>');
    expect(registeredListeners(element)).toEqual({
      click: { listener: handler1 },
    });
  });
  test("with nested elements", () => {
    const element = createElement({
      tagName: "div",
      attributes: { id: "head" },
      children: [
        {
          tagName: "h1",
          children: ["Title"],
        },
        {
          tagName: "p",
          children: ["Content"],
        },
      ],
    });
    expect(element.outerHTML).toEqual(
      '<div id="head"><h1>Title</h1><p>Content</p></div>'
    );
  });
});

describe("updateElement", () => {
  test("add attribute", () => {
    const html = parseHtml("<div></div>") as HTMLDivElement;
    const target = createVirtual("div", { class: "foo" });
    updateElement(html, target);
    expect(html.outerHTML).toEqual('<div class="foo"></div>');
  });
  test("remove attribute", () => {
    const html = parseHtml('<div class="foo"></div>') as HTMLDivElement;
    const target = createVirtual("div");
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div></div>");
  });
  test("change attribute", () => {
    const html = parseHtml('<div class="foo"></div>') as HTMLDivElement;
    const target = createVirtual("div", { class: "bar" });
    updateElement(html, target);
    expect(html.outerHTML).toEqual('<div class="bar"></div>');
  });
  test("add / remove listener", () => {
    const html = parseHtml("<div></div>") as HTMLDivElement;
    updateElement(html, createVirtual("div", { onClick: handler1 }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handler1 },
    });
    updateElement(html, createVirtual("div"));
    expect(registeredListeners(html)).toEqual({});
  });
  test("change listener", () => {
    const html = parseHtml("<div></div>") as HTMLDivElement;
    updateElement(html, createVirtual("div", { onClick: handler1 }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handler1 },
    });
    updateElement(html, createVirtual("div", { onClick: handler2 }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handler2 },
    });
    updateElement(html, createVirtual("div", { onClick: handlerObject }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handlerObject },
    });
  });
  test("change listener with options", () => {
    const html = parseHtml("<div></div>") as HTMLDivElement;
    updateElement(html, createVirtual("div", { onClick: { listener: handler1, options: { capture: true } } }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handler1, options: { capture: true } },
    });
    updateElement(html, createVirtual("div", { onClick: { listener: handler2, options: { passive: true } } }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handler2, options: { passive: true } },
    });
    updateElement(html, createVirtual("div", { onClick: { listener: handlerObject, options: { once: true } } }));
    expect(registeredListeners(html)).toEqual({
      click: { listener: handlerObject, options: { once: true } },
    });
  });
  test("add text child", () => {
    const html = parseHtml("<div></div>") as HTMLDivElement;
    const target = createVirtual("div", {}, "Hello");
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div>Hello</div>");
  });
  test("remove text child", () => {
    const html = parseHtml("<div>Hello</div>") as HTMLDivElement;
    const target = createVirtual("div");
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div></div>");
  });
  test("change text child", () => {
    const html = parseHtml("<div>Hello</div>") as HTMLDivElement;
    const target = createVirtual("div", {}, "World");
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div>World</div>");
  });
  test("add node child", () => {
    const html = parseHtml("<div></div>") as HTMLDivElement;
    const target = createVirtual("div", {}, createVirtual("span"));
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div><span></span></div>");
  });
  test("remove node child", () => {
    const html = parseHtml("<div><span></span></div>") as HTMLDivElement;
    const target = createVirtual("div");
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div></div>");
  });
  test("change node child", () => {
    const html = parseHtml("<div><span></span></div>") as HTMLDivElement;
    const target = createVirtual("div", {}, createVirtual("h1"));
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div><h1></h1></div>");
  });
  test("change order", () => {
    const html = parseHtml("<div><h1></h1><h2></h2></div>") as HTMLDivElement;
    const target = createVirtual(
      "div",
      {},
      createVirtual("h2"),
      createVirtual("h1")
    );
    updateElement(html, target);
    expect(html.outerHTML).toEqual("<div><h2></h2><h1></h1></div>");
  });
  test("change keyed", () => {
    const html = parseHtml(
      '<div><span key="1"></span><span key="2"></span></div>'
    ) as HTMLDivElement;
    const target = createVirtual(
      "div",
      {},
      createVirtual("span", { key: "2" }),
      createVirtual("span", { key: "3" })
    );
    updateElement(html, target);
    expect(html.outerHTML).toEqual(
      '<div><span key="2"></span><span key="3"></span></div>'
    );
  });
});
