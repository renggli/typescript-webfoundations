import { describe, expect, test } from "vitest";
import { createVirtual, createElement } from "./dom";

const handler1 = () => 1;
const handler2 = () => 2;

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
  test("with a single listeners", () => {
    const virtual = createVirtual("p", { onClick: handler1 });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: { click: handler1 },
    });
  });
  test("with a multiple listeners", () => {
    const virtual = createVirtual("p", {
      onMouseEnter: handler1,
      onMouseLeave: handler2,
    });
    expect(virtual).toEqual({
      tagName: "p",
      listeners: { mouseenter: handler1, mouseleave: handler2 },
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
      listeners: { click: handler1 },
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
  test("with a single listeners", () => {
    const element = createElement({
      tagName: "p",
      listeners: { click: handler1 },
    });
    expect(element.outerHTML).toEqual("<p></p>");
  });
  test("with a multiple listeners", () => {
    const element = createElement({
      tagName: "p",
      listeners: { mouseenter: handler1, mouseleave: handler2 },
    });
    expect(element.outerHTML).toEqual("<p></p>");
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
      listeners: { click: handler1 },
      children: ["bar"],
    });
    expect(element.outerHTML).toEqual('<div id="foo">bar</div>');
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
