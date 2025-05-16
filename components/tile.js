class TileComponent extends HTMLElement {
  static observedAttributes = ['width', 'height', 'background'];

  #container;

  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    this.#container = this.shadowRoot.querySelector('.container');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'width':
        this.#container.style.width = newValue;
        break;
      case 'height':
        this.#container.style.height = newValue;
        break;
      case 'background':
        this.#container.style.backgroundImage = newValue
          ? `url("${encodeURI(newValue)}")`
          : undefined;
        break;
    }
  }
}

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="${import.meta.resolve('./tile.css')}">
  <div class="container">
    <slot></slot>
  <div>
`

export function registerTileComponent() {
  customElements.define('wf-tile', TileComponent);
}
