const KEY_ATTRIBUTE = "key";
const REGISTERED_LISTENERS = Symbol("__registered_listeners");

// DOM Extensions.
declare global {
  interface EventTarget {
    [REGISTERED_LISTENERS]?: Listeners;
  }
  interface Node {
    moveBefore<T extends Node>(node: T, child: Node | null): T;
  }
}

// Types used for the virtual DOM specification.
type Attributes = Record<string, string>;
type Listeners = Record<string, EventListenerOrEventListenerObject>;
type Children = Array<string | VirtualDOM<any>>;

/** Specification of a DOM node. */
export interface VirtualDOM<E> {
  /** The tag name of the element. */
  tagName: E;
  /** The namespace URL of the element. */
  namespaceURI?: string;
  /** Attributes of the element. */
  attributes?: Attributes;
  /** Listeners attached to the element. */
  listeners?: Listeners;
  /** Children of the element. */
  children?: Children;
}

// Types used for the [createVirtual] function.
type VirtualProps = Record<string, string | EventListenerOrEventListenerObject>;
type VirtualChild = string | VirtualDOM<any>;

/**
 * Helper to creates a `VirtualDOM` node given the arguments.
 */
export function createVirtual<E extends keyof HTMLElementTagNameMap>(
  tagName: E,
  props?: VirtualProps,
  ...children: VirtualChild[]
): VirtualDOM<E>;
export function createVirtual<E extends keyof SVGElementTagNameMap>(
  tagName: E,
  props?: VirtualProps,
  ...children: VirtualChild[]
): VirtualDOM<E>;
export function createVirtual(
  tagName: string,
  props?: VirtualProps,
  ...children: VirtualChild[]
): VirtualDOM<string> {
  // Prepare the function arguments.
  let attributes: Attributes | undefined;
  let listeners: Listeners | undefined;
  // Create the attributes and listeners.
  if (props) {
    for (const name of Object.getOwnPropertyNames(props)) {
      const value = props[name];
      if (name.startsWith("on") && typeof value === "function") {
        (listeners ??= {})[name.slice(2).toLowerCase()] = value;
      } else if (typeof value === "string") {
        (attributes ??= {})[name] = value;
      }
    }
  }
  // Create the virtual element.
  return {
    tagName,
    attributes,
    listeners,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Given a `VirtualDOM` specification, recursively constructs a DOM tree.
 *
 * This function takes a `VirtualDOM` object, which describes the desired
 * element (including its tag name, attributes, event listeners, and children),
 * and creates the corresponding DOM element. If the `children` array in the
 * specification contains further `VirtualDOM` objects, `buildElement` will be
 * called recursively to construct those child elements as well.
 *
 * @example
 * const element = buildElement({
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
 * document.body.appendChild(element);
 */
export function createElement<E extends keyof HTMLElementTagNameMap>(
  virtual: VirtualDOM<E>
): HTMLElementTagNameMap[E];
export function createElement<E extends keyof SVGElementTagNameMap>(
  virtual: VirtualDOM<E>
): SVGElementTagNameMap[E];
export function createElement<E extends Element = Element>({
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
        element.appendChild(createElement(child));
      } else {
        element.appendChild(document.createTextNode(child.toString()));
      }
    }
  }
  return element as Element as E;
}

/**
 * Given an existing DOM Element and a `VirtualDOM` specification, recursively
 * updates the element to match the specification.
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
      // No match found, build new element.
      newNodes.push(createElement(child));
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
