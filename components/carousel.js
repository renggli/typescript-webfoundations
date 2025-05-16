class CarouselComponent extends HTMLElement {
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
    }
  }
}

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="${import.meta.resolve('./carousel.css')}">
  <div class="container">
    <slot></slot>
  <div>
`

export function registerCarouselComponent() {
  customElements.define('wf-carousel', CarouselComponent);
}
