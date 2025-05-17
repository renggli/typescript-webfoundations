class CarouselComponent extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
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
