const KEY_ATTRIBUTE = "key";

const REGISTERED_LISTENERS = Symbol("__registered_listeners");
declare global {
  interface EventTarget {
    [REGISTERED_LISTENERS]?: Listeners;
  }
  interface Node {
    moveBefore<T extends Node>(node: T, child: Node | null): T;
  }
}

// Types used for the [createElement] function.
type CreateElementProps = Record<
  string,
  string | EventListenerOrEventListenerObject
>;
type CreateElementChild = string | Node;

/**
 * Creates a new HTML element with the specified tag name, properties, and child nodes.
 */
export function createElement<E extends keyof HTMLElementTagNameMap>(
  tagName: E,
  propsOrChild?: CreateElementProps | CreateElementChild,
  ...childArgs: CreateElementChild[]
): HTMLElementTagNameMap[E];
export function createElement<E extends keyof SVGElementTagNameMap>(
  tagName: E,
  propsOrChild?: CreateElementProps | CreateElementChild,
  ...childArgs: CreateElementChild[]
): SVGElementTagNameMap[E];
export function createElement<E extends Element = Element>(
  tagName: string,
  propsOrChild?: CreateElementProps | CreateElementChild,
  ...childArgs: CreateElementChild[]
): E {
  // Prepare the function arguments.
  let props: CreateElementProps;
  const attributes: Attributes = {};
  const listeners: Listeners = {};
  const children: Array<string | Node> = [];
  if (typeof propsOrChild === "string" || propsOrChild instanceof Node) {
    children.push(propsOrChild);
    props = {};
  } else {
    props = propsOrChild ?? {};
  }
  children.push(...childArgs);
  // Create the attributes and listeners.
  for (const name of Object.getOwnPropertyNames(props)) {
    const value = props[name];
    if (name.startsWith("on") && typeof value === "function") {
      listeners[name.slice(2).toLowerCase()] = value;
    } else if (typeof value === "string") {
      attributes[name] = value;
    }
  }
  // Create the element.
  return buildElement({
    tagName,
    attributes,
    listeners,
    children,
  } as VirtualDOM<any>);
}

// Types used for the virtual DOM specification.
type Attributes = Record<string, string>;
type Listeners = Record<string, EventListenerOrEventListenerObject>;
type Children = Array<string | Node | VirtualDOM<any>>;

// Virtual DOM specification.
export interface VirtualDOM<E> {
  tagName: E;
  namespaceURI?: string;
  attributes?: Attributes;
  listeners?: Listeners;
  children?: Children;
}

/**
 * Recursively constructs a DOM element based on a `VirtualDOM` specification.
 *
 * This function takes a `VirtualDOM` object, which describes the desired
 * element (including its tag name, attributes, event listeners, and children),
 * and creates the corresponding DOM element. If the `children` array in the
 * specification contains further `VirtualDOM` objects, `buildElement` will be
 * called recursively to construct those child elements.
 *
 * @example
 * const myComponent = buildElement({
 *   tagName: 'div',
 *   attributes: { id: 'my-component', class: 'container' },
 *   listeners: {
 *     click: () => console.log('Component clicked!')
 *   },
 *   children: [
 *     { tagName: 'h1', children: ['Hello, World!'] },
 *     'This is a paragraph.',
 *     document.createElement('hr')
 *   ]
 * });
 * document.body.appendChild(myComponent);
 */
export function buildElement<E extends keyof HTMLElementTagNameMap>(
  options: VirtualDOM<E>
): HTMLElementTagNameMap[E];
export function buildElement<E extends keyof SVGElementTagNameMap>(
  options: VirtualDOM<E>
): SVGElementTagNameMap[E];
export function buildElement<E extends Element = Element>({
  tagName,
  namespaceURI,
  attributes,
  listeners,
  children,
}: VirtualDOM<string>): E {
  const element = namespaceURI
    ? document.createElementNS(namespaceURI, tagName)
    : document.createElement(tagName);
  // Set attributes.
  if (attributes) {
    for (const name of Object.getOwnPropertyNames(attributes)) {
      element.setAttribute(name, attributes[name]);
    }
  }
  // Add event listeners.
  if (listeners) {
    for (const name of Object.getOwnPropertyNames(listeners)) {
      const listener = listeners[name];
      element.addEventListener(name, listener);
      const registeredListeners = (element[REGISTERED_LISTENERS] ??= {});
      registeredListeners[name] = listener;
    }
  }
  // Add child nodes.
  if (children) {
    for (const child of children) {
      if (child instanceof Node) {
        element.appendChild(child);
      } else if (typeof child === "object") {
        element.appendChild(buildElement(child));
      } else {
        element.appendChild(document.createTextNode(child.toString()));
      }
    }
  }
  return element as Element as E;
}

/**
 * Recursively updates an existing DOM element to match a new `VirtualDOM` specification.
 *
 * This function efficiently modifies the provided `element` in place to reflect
 * the state described by the `options` (a `VirtualDOM` object). It updates
 * attributes, event listeners, and children, aiming to make only necessary
 * changes to the DOM.
 *
 * @example
 * let value = 0;
 *
 * function update() {
 *   updateElement(document.body, {
 *     children: [
 *       { tagName: 'h1', children: [ value ] },
 *       {
 *         tagName: 'div',
 *         children: [
 *           {
 *             tagName: 'a',
 *             listeners: { 'click': () => { value--; update(); } },
 *             children: [ '--' ],
 *           },
 *           {
 *             tagName: 'a',
 *             listeners: { 'click': () => { value++; update(); } },
 *             children: [ '++' ],
 *           },
 *         ],
 *       },
 *     ],
 *   });
 * }
 *
 * update();
 */
export function updateElement<E extends keyof HTMLElementTagNameMap>(
  element: HTMLElementTagNameMap[E],
  options: VirtualDOM<E>
): HTMLElementTagNameMap[E];
export function updateElement<E extends keyof SVGElementTagNameMap>(
  element: SVGElementTagNameMap[E],
  options: VirtualDOM<E>
): SVGElementTagNameMap[E];
export function updateElement<E extends Element = Element>(
  element: E,
  { tagName, attributes, listeners, children }: VirtualDOM<string>
): E {
  if (element.nodeType !== Node.ELEMENT_NODE) {
    throw Error(
      `Expected element with type ${Node.ELEMENT_NODE}, but got ${element.nodeType}.`
    );
  } else if (element.tagName.toLowerCase() !== tagName.toLowerCase()) {
    throw Error(
      `Expected element with tag name "${tagName}", but got "${element.tagName}".`
    );
  }
  updateAttributes(element, attributes);
  updateListeners(element, listeners);
  updateChildren(element, children);
  return element;
}

/** Internal helper to in-place update the attributes. */
function updateAttributes(element: Element, attributes: Attributes = {}) {
  const namesToRemove = [];
  for (const name of element.getAttributeNames()) {
    if (!attributes[name]) {
      namesToRemove.push(name);
    }
  }
  for (const name of Object.getOwnPropertyNames(attributes)) {
    if (element.getAttribute(name) !== attributes[name]) {
      element.setAttribute(name, attributes[name]);
    }
  }
  for (const name of namesToRemove) {
    element.removeAttribute(name);
  }
}

/** Internal helper to in-place update the event listeners. */
function updateListeners(element: Element, listeners: Listeners = {}) {
  const registeredListeners = (element[REGISTERED_LISTENERS] ??= {});
  for (const name of Object.getOwnPropertyNames(registeredListeners)) {
    if (registeredListeners[name] !== listeners[name]) {
      element.removeEventListener(name, registeredListeners[name]);
      delete registeredListeners[name];
    }
  }
  for (const name of Object.getOwnPropertyNames(listeners)) {
    if (registeredListeners[name] !== listeners[name]) {
      element.addEventListener(name, listeners[name]);
      registeredListeners[name] = listeners[name];
    }
  }
}

/** Internal helper to in-place update the children. */
function updateChildren(parent: Element, children: Children = []) {
  // Index the old children.
  const keyedElements = new Map<string, Element>();
  const otherElements: Element[] = [];
  const textNodes = new Map<string, Text>();
  for (const node of [...parent.childNodes]) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const key = element.getAttribute(KEY_ATTRIBUTE);
      if (key) {
        keyedElements.set(key, element);
      } else {
        otherElements.push(element);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      if (text.textContent) {
        textNodes.set(text.textContent, text);
      }
    }
  }

  // Build the list of new children.
  const newNodes: Node[] = [];
  for (const child of children) {
    if (child instanceof Node) {
      newNodes.push(child);
    } else if (typeof child === "object") {
      // Handle keyed elements.
      const key = child.attributes?.[KEY_ATTRIBUTE];
      if (key) {
        const element = keyedElements.get(key);
        if (
          element &&
          element.tagName.toLowerCase() === child.tagName.toLowerCase()
        ) {
          updateElement(element, child);
          keyedElements.delete(key);
          newNodes.push(element);
          continue;
        }
      }
      // Handle other elements.
      const index = otherElements.findIndex(
        (element) =>
          element.tagName.toLowerCase() == child.tagName.toLowerCase()
      );
      if (index >= 0) {
        const element = otherElements[index];
        updateElement(element, child);
        otherElements.splice(index, 1);
        newNodes.push(element);
        continue;
      }
      // No match found, build element.
      newNodes.push(buildElement(child));
    } else {
      // Try reusing the text elements.
      const text = child.toString();
      const textNode = textNodes.get(text);
      if (textNode) {
        newNodes.push(textNode);
        textNodes.delete(text);
        continue;
      }
      // No match found, create node.
      newNodes.push(document.createTextNode(text));
    }
  }

  // Remove elements no longer present.
  for (const element of [
    ...keyedElements.values(),
    ...otherElements,
    ...textNodes.values(),
  ]) {
    parent.removeChild(element);
  }

  // Insert new nodes and move old ones to the right place.
  for (let i = newNodes.length - 1; i >= 0; i--) {
    const node = newNodes[i];
    const nextSibling = newNodes[i + 1] ?? null;
    if (node.parentNode === parent) {
      if (node.nextSibling !== nextSibling) {
        if (parent.moveBefore) {
          parent.moveBefore(node, nextSibling);
        } else {
          parent.insertBefore(node, nextSibling);
        }
      }
    } else {
      parent.insertBefore(node, nextSibling);
    }
  }
}
