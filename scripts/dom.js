export function createElement(name, props = {}, children = []) {
  const element = document.createElement(name);
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      if (key.startsWith('on')) {
        const name = key.substring(2).toLowerCase();
        node.addEventListener(name, props[key]);
      } else {
        node.setAttribute(key, props[key]);
      }
    }
  }
  for (const child of children) {
    if (child) {
      element.appendChild(child instanceof Node
        ? child
        : document.createTextNode(child));
    }
  }
  return element;
}
