export const KEY_ATTRIBUTE = "key";
export const REGISTERED_LISTENERS = Symbol("__registered_listeners");

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
type Listener = { listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions }
type Listeners = Record<string, Listener>;
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
type VirtualProps = Record<string, string | EventListenerOrEventListenerObject | Listener>;
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
export function createVirtual<E extends string = string>(
  tagName: E,
  props?: VirtualProps,
  ...children: VirtualChild[]
): VirtualDOM<E> {
  // Prepare the function arguments.
  let attributes: Attributes | undefined;
  let listeners: Listeners | undefined;
  // Create the attributes and listeners.
  if (props) {
    for (const [name, value] of Object.entries(props)) {
      if (name.startsWith("on")) {
        let listener: Listener | undefined;
        if (typeof value === 'function' || (typeof value === 'object' && 'handleEvent' in value)) {
          listener = { listener: value };
        } else if (typeof value === 'object' && 'listener' in value) {
          listener = value;
        }
        if (listener) {
          (listeners ??= {})[name.slice(2).toLowerCase()] = listener;
          continue;
        }
      }
      if (value) {
        (attributes ??= {})[name] = value.toString();
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
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
  }
  // Add event listeners.
  if (listeners) {
    for (const [name, value] of Object.entries(listeners)) {
      element.addEventListener(name, value.listener, value.options);
      const registeredListeners = (element[REGISTERED_LISTENERS] ??= {});
      registeredListeners[name] = value;
    }
  }
  // Add child nodes.
  if (children) {
    for (const child of children) {
      if (typeof child === "object") {
        element.appendChild(createElement(child));
      } else {
        element.appendChild(document.createTextNode(child.toString()));
      }
    }
  }
  return element as E;
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
  { attributes, listeners, children }: Omit<VirtualDOM<string>, "tagName">
): E {
  updateAttributes(element, attributes);
  updateListeners(element, listeners);
  updateChildren(element, children);
  return element;
}


// Internal helper to in-place update attributes.
function updateAttributes(element: Element, attributes: Attributes = {}) {
  const namesToRemove = [];
  for (const name of element.getAttributeNames()) {
    if (!attributes[name]) {
      namesToRemove.push(name);
    }
  }
  for (const [name, value] of Object.entries(attributes)) {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }
  for (const name of namesToRemove) {
    element.removeAttribute(name);
  }
}


// Internal helper to in-place update event listeners.
function updateListeners(element: Element, listeners: Listeners = {}) {
  const registeredListeners = (element[REGISTERED_LISTENERS] ??= {});
  for (const [name, value] of Object.entries(registeredListeners)) {
    if (listeners[name]?.listener !== value.listener) {
      element.removeEventListener(name, value.listener, value.options);
      delete registeredListeners[name];
    }
  }
  for (const [name, value] of Object.entries(listeners)) {
    if (registeredListeners[name]?.listener !== value.listener) {
      element.addEventListener(name, value.listener, value.options);
      registeredListeners[name] = value;
    }
  }
}


// Internal helper to in-place update the children.
function updateChildren(parent: Element, children: Children = []) {
  // Index the old children.
  const elements = new Map<string, Element[]>();
  const texts = new Map<string, Text>();
  for (const node of [...parent.childNodes]) {
    if (node instanceof Element) {
      let key = node.tagName.toLowerCase();
      if (node.hasAttribute(KEY_ATTRIBUTE)) {
        key += `|${node.getAttribute(KEY_ATTRIBUTE)}`;
      }
      getMapList(elements, key).push(node);
    } else if (node instanceof Text) {
      texts.set(node.textContent ?? '', node);
    }
  }
  // Build the list of new children.
  const newNodes: Node[] = [];
  for (const child of children) {
    if (typeof child === "object") {
      let key = child.tagName.toLowerCase();
      if (child.attributes?.[KEY_ATTRIBUTE]) {
        key += `|${child.attributes[KEY_ATTRIBUTE]}`;
      }
      const element = getMapList(elements, key).shift()
        ?? createElement(child);
      newNodes.push(element);
    } else {
      // Try reusing the text elements.
      const text = child.toString();
      const node = texts.get(text);
      if (node) {
        newNodes.push(node);
        texts.delete(text);
      } else {
        newNodes.push(document.createTextNode(text));
      }
    }
  }
  // Remove elements no longer present.
  for (const elementList of elements.values()) {
    for (const element of elementList) {
      parent.removeChild(element);
    }
  }
  for (const text of texts.values()) {
    parent.removeChild(text);
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

// Returns and possibly creates a new list entry in a map.
function getMapList<K, V>(map: Map<K, V[]>, key: K): V[] {
  const values = map.get(key);
  if (values) return values;
  const result: V[] = [];
  map.set(key, result);
  return result;
}
