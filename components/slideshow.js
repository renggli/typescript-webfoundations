class SlideshowComponent extends HTMLElement {
  constructor() {
    super();
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    this.update();
  }

  static get observedAttributes() {
    return [];
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
  }
}

const template = document.createElement('template');
template.innerHTML = `
<link rel="stylesheet" href="${import.meta.resolve('./slideshow.css')}">
<div class="container">
  <div class="items>
    <slot></slot>
  </div>
  <div class="scroll"></div>
</div>
`

export function registerSlideshowComponent() {
  customElements.define('wf-slideshow', SlideshowComponent);
}
